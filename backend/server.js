
const express = require('express')
const cors = require('cors')
const db = require('./db')

const app = express()

const authRoutes = require('./routes/auth')
const ticketRoutes = require('./routes/tickets')
const commentRoutes = require('./routes/comments')

// Middleware
app.use(cors())
app.use(express.json())

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/comments', commentRoutes)

// Home route
app.get('/', (req, res) => {
  res.send('Support Ticket System Backend is Running!')
})

// Database test route
app.get('/test-db', (req, res) => {
  db.query('SELECT 1', (err, results) => {
    if (err) {
      console.error('Database test error:', err.message)
      return res.status(500).send('Database connection failed')
    }

    res.send('Database connected successfully!')
  })
})

// Start server only when running this file directly
const PORT = process.env.PORT || 5000

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

// Export app for Jest and Supertest
module.exports = app