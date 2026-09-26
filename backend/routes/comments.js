
const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// ADD COMMENT
router.post('/:ticketId', verifyToken, (req, res) => {
  const ticketId = req.params.ticketId;
  const userId = req.user.id;
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({
      message: 'Comment is required',
    });
  }

  let sql = 'SELECT id FROM tickets WHERE id = ?';
  let params = [ticketId];

  if (req.user.role === 'customer') {
    sql += ' AND user_id = ?';
    params.push(userId);
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: 'Database error',
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: 'Ticket not found',
      });
    }

    db.query(
      `INSERT INTO ticket_comments
       (ticket_id, user_id, comment)
       VALUES (?, ?, ?)`,
      [ticketId, userId, comment],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            message: 'Could not add comment',
          });
        }

        res.status(201).json({
          message: 'Comment added successfully',
          commentId: result.insertId,
        });
      }
    );
  });
});

// GET COMMENTS
router.get('/:ticketId', verifyToken, (req, res) => {
  const ticketId = req.params.ticketId;

  let sql = `
    SELECT
      c.id,
      c.ticket_id,
      c.user_id,
      c.comment,
      c.created_at,
      u.name AS commenter_name,
      u.role
    FROM ticket_comments c
    JOIN users u ON c.user_id = u.id
    JOIN tickets t ON c.ticket_id = t.id
    WHERE c.ticket_id = ?
  `;

  let params = [ticketId];

  if (req.user.role === 'customer') {
    sql += ' AND t.user_id = ?';
    params.push(req.user.id);
  }

  sql += ' ORDER BY c.created_at ASC';

  db.query(sql, params, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: 'Could not fetch comments',
      });
    }

    res.json({
      comments: results,
    });
  });
});

module.exports = router;