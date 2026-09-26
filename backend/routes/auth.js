const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

// REGISTER API
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: 'Please provide name, email and password',
    });
  }

  try {
    // Check whether email already exists
    db.query(
      'SELECT id FROM users WHERE email = ?',
      [email],
      async (err, results) => {
        if (err) {
          return res.status(500).json({
            message: 'Database error',
          });
        }

        if (results.length > 0) {
          return res.status(409).json({
            message: 'Email already registered',
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user in database
        db.query(
          `INSERT INTO users (name, email, password_hash, role)
           VALUES (?, ?, ?, 'customer')`,
          [name, email, hashedPassword],
          (err, result) => {
            if (err) {
              return res.status(500).json({
                message: 'Could not register user',
              });
            }

            res.status(201).json({
              message: 'Registration successful',
              userId: result.insertId,
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
    });
  }
});

// LOGIN API
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: 'Please provide email and password',
    });
  }

  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, results) => {
      if (err) {
        return res.status(500).json({
          message: 'Database error',
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          message: 'Invalid email or password',
        });
      }

      const user = results[0];

      try {
        const isMatch = await bcrypt.compare(
          password,
          user.password_hash
        );

        if (!isMatch) {
          return res.status(401).json({
            message: 'Invalid email or password',
          });
        }

        const token = jwt.sign(
          {
            id: user.id,
            role: user.role,
          },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );

        res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      } catch (error) {
        res.status(500).json({
          message: 'Login failed',
        });
      }
    }
  );
});

module.exports = router;