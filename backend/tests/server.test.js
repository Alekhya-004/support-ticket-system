
const request = require('supertest')

// Mock database
jest.mock('../db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}))

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'test-jwt-token'),
  verify: jest.fn(),
}))

// Mock authentication middleware
jest.mock('../middleware/authMiddleware', () => {
  return (req, res, next) => {
    const token = req.headers.authorization

    if (!token) {
      return res.status(401).json({
        message: 'Access denied. No token provided.',
      })
    }

    if (token === 'Bearer customer-token') {
      req.user = { id: 1, role: 'customer' }
      return next()
    }

    if (token === 'Bearer agent-token') {
      req.user = { id: 2, role: 'agent' }
      return next()
    }

    return res.status(401).json({
      message: 'Invalid token',
    })
  }
})

const db = require('../db')
const bcrypt = require('bcrypt')
const app = require('../server')

describe('Support Ticket System API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // 1. HOME ROUTE TEST

  test('GET / should return the backend running message', async () => {
    const response = await request(app).get('/')

    expect(response.statusCode).toBe(200)

    expect(response.text).toBe(
      'Support Ticket System Backend is Running!'
    )
  })

  // 2. LOGIN TESTS

  test('Login should return a token for valid credentials', async () => {
    db.query.mockImplementation((sql, values, callback) => {
      callback(null, [
        {
          id: 1,
          name: 'Alekhya',
          email: 'alekhyatest@example.com',
          password_hash: 'fake-hashed-password',
          role: 'customer',
        },
      ])
    })

    bcrypt.compare.mockResolvedValue(true)

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alekhyatest@example.com',
        password: 'test-password',
      })

    expect(response.statusCode).toBe(200)
    expect(response.body.message).toBe('Login successful')
    expect(response.body.token).toBe('test-jwt-token')
    expect(response.body.user.role).toBe('customer')
  })

  test('Login should reject an invalid password', async () => {
    db.query.mockImplementation((sql, values, callback) => {
      callback(null, [
        {
          id: 1,
          name: 'Alekhya',
          email: 'alekhyatest@example.com',
          password_hash: 'fake-hashed-password',
          role: 'customer',
        },
      ])
    })

    bcrypt.compare.mockResolvedValue(false)

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alekhyatest@example.com',
        password: 'wrong-password',
      })

    expect(response.statusCode).toBe(401)

    expect(response.body.message).toBe(
      'Invalid email or password'
    )
  })

  test('Login should reject missing credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: '',
        password: '',
      })

    expect(response.statusCode).toBe(400)

    expect(response.body.message).toBe(
      'Please provide email and password'
    )
  })

  // 3. TICKET TESTS

  test('Customer should be able to create a ticket', async () => {
    db.query.mockImplementation((sql, values, callback) => {
      callback(null, { insertId: 10 })
    })

    const response = await request(app)
      .post('/api/tickets')
      .set('Authorization', 'Bearer customer-token')
      .send({
        subject: 'Test ticket',
        description: 'Testing ticket creation',
        priority: 'medium',
      })

    expect(response.statusCode).toBe(201)

    expect(response.body.message).toBe(
      'Ticket created successfully'
    )

    expect(response.body.ticketId).toBe(10)
  })

  test('Ticket creation should reject missing subject', async () => {
    const response = await request(app)
      .post('/api/tickets')
      .set('Authorization', 'Bearer customer-token')
      .send({
        description: 'Testing missing subject',
      })

    expect(response.statusCode).toBe(400)

    expect(response.body.message).toBe(
      'Subject and description are required'
    )
  })

  test('Customer should see only their own tickets', async () => {
    db.query.mockImplementation((sql, values, callback) => {
      callback(null, [
        {
          id: 10,
          user_id: 1,
          subject: 'My ticket',
          status: 'open',
        },
      ])
    })

    const response = await request(app)
      .get('/api/tickets')
      .set('Authorization', 'Bearer customer-token')

    expect(response.statusCode).toBe(200)
    expect(response.body.tickets).toHaveLength(1)

    expect(response.body.tickets[0].user_id).toBe(1)

    // Verify customer ownership filter
    expect(db.query.mock.calls[0][0]).toContain(
      'WHERE t.user_id = ?'
    )

    expect(db.query.mock.calls[0][1]).toEqual([1])
  })

  test('Agent should be able to update a ticket', async () => {
    db.query.mockImplementation((sql, values, callback) => {
      callback(null, { affectedRows: 1 })
    })

    const response = await request(app)
      .put('/api/tickets/10')
      .set('Authorization', 'Bearer agent-token')
      .send({
        status: 'closed',
      })

    expect(response.statusCode).toBe(200)

    expect(response.body.message).toBe(
      'Ticket updated successfully'
    )
  })

  test('Customer should not be allowed to update a ticket', async () => {
    const response = await request(app)
      .put('/api/tickets/10')
      .set('Authorization', 'Bearer customer-token')
      .send({
        status: 'closed',
      })

    expect(response.statusCode).toBe(403)

    expect(response.body.message).toBe(
      'Only agents can update tickets'
    )
  })

  test('Ticket API should reject requests without a token', async () => {
    const response = await request(app).get('/api/tickets')

    expect(response.statusCode).toBe(401)
  })

  // 4. COMMENT TESTS

  test('Customer should be able to add a comment to their ticket', async () => {
    db.query
      .mockImplementationOnce((sql, values, callback) => {
        // Check ticket ownership
        callback(null, [{ id: 10 }])
      })
      .mockImplementationOnce((sql, values, callback) => {
        // Insert comment
        callback(null, { insertId: 25 })
      })

    const response = await request(app)
      .post('/api/comments/10')
      .set('Authorization', 'Bearer customer-token')
      .send({
        comment: 'I need help with this issue',
      })

    expect(response.statusCode).toBe(201)

    expect(response.body.message).toBe(
      'Comment added successfully'
    )

    expect(response.body.commentId).toBe(25)
  })

  test('Adding a comment should reject an empty comment', async () => {
    const response = await request(app)
      .post('/api/comments/10')
      .set('Authorization', 'Bearer customer-token')
      .send({
        comment: '',
      })

    expect(response.statusCode).toBe(400)

    expect(response.body.message).toBe(
      'Comment is required'
    )
  })

  test('Customer should not comment on another customer ticket', async () => {
    db.query.mockImplementation((sql, values, callback) => {
      // Ticket not found for this customer
      callback(null, [])
    })

    const response = await request(app)
      .post('/api/comments/10')
      .set('Authorization', 'Bearer customer-token')
      .send({
        comment: 'Trying to comment on another ticket',
      })

    expect(response.statusCode).toBe(404)

    expect(response.body.message).toBe(
      'Ticket not found'
    )
  })

  test('Customer should be able to view comments on their ticket', async () => {
    db.query.mockImplementation((sql, values, callback) => {
      callback(null, [
        {
          id: 25,
          ticket_id: 10,
          user_id: 1,
          comment: 'I need help with this issue',
          commenter_name: 'Alekhya',
          role: 'customer',
        },
      ])
    })

    const response = await request(app)
      .get('/api/comments/10')
      .set('Authorization', 'Bearer customer-token')

    expect(response.statusCode).toBe(200)

    expect(response.body.comments).toHaveLength(1)

    expect(response.body.comments[0].comment).toBe(
      'I need help with this issue'
    )

    // Verify customer ownership filter
    expect(db.query.mock.calls[0][0]).toContain(
      'AND t.user_id = ?'
    )

    expect(db.query.mock.calls[0][1]).toEqual(['10', 1])
  })
})