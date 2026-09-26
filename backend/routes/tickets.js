
const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// CREATE TICKET
router.post('/', verifyToken, (req, res) => {
  const { subject, description, priority } = req.body;
  const userId = req.user.id;

  if (!subject || !description) {
    return res.status(400).json({
      message: 'Subject and description are required',
    });
  }

  const validPriorities = ['low', 'medium', 'high'];

  const ticketPriority = priority || 'medium';

  if (!validPriorities.includes(ticketPriority)) {
    return res.status(400).json({
      message: 'Priority must be low, medium, or high',
    });
  }

  const sql = `
    INSERT INTO tickets
    (user_id, subject, description, priority)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [userId, subject, description, ticketPriority],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: 'Could not create ticket',
        });
      }

      res.status(201).json({
        message: 'Ticket created successfully',
        ticketId: result.insertId,
      });
    }
  );
});

// GET ALL TICKETS
router.get('/', verifyToken, (req, res) => {
  let sql = `
    SELECT
      t.*,
      u.name AS customer_name
    FROM tickets t
    JOIN users u ON t.user_id = u.id
  `;

  let params = [];

  // Customers can view only their own tickets
  if (req.user.role === 'customer') {
    sql += ' WHERE t.user_id = ?';
    params.push(req.user.id);
  }

  sql += ' ORDER BY t.created_at DESC';

  db.query(sql, params, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: 'Could not fetch tickets',
      });
    }

    res.json({
      tickets: results,
    });
  });
});

// GET A SINGLE TICKET
router.get('/:id', verifyToken, (req, res) => {
  const ticketId = req.params.id;

  let sql = `
    SELECT
      t.*,
      u.name AS customer_name
    FROM tickets t
    JOIN users u ON t.user_id = u.id
    WHERE t.id = ?
  `;

  let params = [ticketId];

  if (req.user.role === 'customer') {
    sql += ' AND t.user_id = ?';
    params.push(req.user.id);
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

    res.json({
      ticket: results[0],
    });
  });
});

router.put('/:id', verifyToken, (req, res) => {
  const ticketId = req.params.id;
  const { status, priority, assigned_to } = req.body;

  // Only agents can update tickets
  if (req.user.role !== 'agent') {
    return res.status(403).json({
      message: 'Only agents can update tickets',
    });
  }

  const validStatuses = ['open', 'in_progress', 'closed'];
  const validPriorities = ['low', 'medium', 'high'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      message: 'Invalid status',
    });
  }

  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({
      message: 'Invalid priority',
    });
  }

  const updates = [];
  const values = [];

  if (status) {
    updates.push('status = ?');
    values.push(status);
  }

  if (priority) {
    updates.push('priority = ?');
    values.push(priority);
  }

  if (assigned_to !== undefined) {
    updates.push('assigned_to = ?');
    values.push(assigned_to);
  }

  if (updates.length === 0) {
    return res.status(400).json({
      message: 'Provide a field to update',
    });
  }

  values.push(ticketId);

  const sql = `
    UPDATE tickets
    SET ${updates.join(', ')}
    WHERE id = ?
  `;

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({
        message: 'Could not update ticket',
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Ticket not found',
      });
    }

    res.json({
      message: 'Ticket updated successfully',
    });
  });
});// DELETE TICKET
router.delete('/:id', verifyToken, (req, res) => {
  const ticketId = req.params.id;

  if (req.user.role !== 'agent') {
    return res.status(403).json({
      message: 'Only agents can delete tickets',
    });
  }

  const sql = 'DELETE FROM tickets WHERE id = ?';

  db.query(sql, [ticketId], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: 'Could not delete ticket',
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Ticket not found',
      });
    }

    res.json({
      message: 'Ticket deleted successfully',
    });
  });
});
module.exports = router;