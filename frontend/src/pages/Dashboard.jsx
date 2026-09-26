
import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import TicketCard from '../components/TicketCard'

const Dashboard = () => {
  const [tickets, setTickets] = useState([])
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  // Comment-related states
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentMessage, setCommentMessage] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentSubmitting, setCommentSubmitting] = useState(false)

  const token = localStorage.getItem('token')
  const role = localStorage.getItem('userRole')

  // Fetch tickets from backend
  const fetchTickets = async () => {
    try {
      const response = await fetch(
        'http://localhost:5000/api/tickets',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const data = await response.json()

      if (response.ok) {
        setTickets(data.tickets || [])
      } else {
        setMessage(data.message || 'Failed to load tickets')
      }
    } catch (error) {
      console.error('Fetch tickets error:', error)
      setMessage('Cannot connect to backend')
    } finally {
      setLoading(false)
    }
  }

  // Load tickets when dashboard opens
  useEffect(() => {
    if (!token) {
      window.location.href = '/login'
      return
    }

    fetchTickets()
  }, [])

  // Create a new ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault()
    setMessage('')

    try {
      const response = await fetch(
        'http://localhost:5000/api/tickets',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject,
            description,
            priority,
          }),
        },
      )

      const data = await response.json()

      if (response.ok) {
        setMessage('Ticket created successfully!')

        setSubject('')
        setDescription('')
        setPriority('medium')

        await fetchTickets()
      } else {
        setMessage(data.message || 'Could not create ticket')
      }
    } catch (error) {
      console.error('Create ticket error:', error)
      setMessage('Cannot connect to backend')
    }
  }

  // Update ticket status (Agent only)
  const handleStatusChange = async (ticket) => {
    let newStatus

    if (ticket.status === 'open') {
      newStatus = 'in_progress'
    } else if (ticket.status === 'in_progress') {
      newStatus = 'closed'
    } else {
      newStatus = 'open'
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/tickets/${ticket.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
            priority: ticket.priority,
          }),
        },
      )

      const data = await response.json()

      if (response.ok) {
        setMessage(`Ticket status changed to ${newStatus}`)
        await fetchTickets()
      } else {
        setMessage(data.message || 'Status update failed')
      }
    } catch (error) {
      console.error('Status update error:', error)
      setMessage('Cannot connect to backend')
    }
  }

  // View ticket details and load comments
  const handleView = async (ticket) => {
    setSelectedTicket(ticket)
    setComments([])
    setNewComment('')
    setCommentMessage('')
    setCommentsLoading(true)

    try {
      const response = await fetch(
        `http://localhost:5000/api/comments/${ticket.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const data = await response.json()

      if (response.ok) {
        setComments(data.comments || [])
      } else {
        setCommentMessage(
          data.message || 'Could not load comments',
        )
      }
    } catch (error) {
      console.error('Fetch comments error:', error)
      setCommentMessage('Cannot connect to backend')
    } finally {
      setCommentsLoading(false)
    }
  }

  // Add a comment to the selected ticket
  const handleAddComment = async (e) => {
    e.preventDefault()

    if (!newComment.trim()) {
      setCommentMessage('Please enter a comment')
      return
    }

    if (!selectedTicket) {
      return
    }

    setCommentSubmitting(true)
    setCommentMessage('')

    try {
      const response = await fetch(
        `http://localhost:5000/api/comments/${selectedTicket.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            comment: newComment,
          }),
        },
      )

      const data = await response.json()

      if (response.ok) {
        setNewComment('')
        setCommentMessage('Comment added successfully!')

        // Refresh the comments
        await handleView(selectedTicket)
      } else {
        setCommentMessage(
          data.message || 'Could not add comment',
        )
      }
    } catch (error) {
      console.error('Add comment error:', error)
      setCommentMessage('Cannot connect to backend')
    } finally {
      setCommentSubmitting(false)
    }
  }

  // Close ticket details
  const handleCloseDetails = () => {
    setSelectedTicket(null)
    setComments([])
    setNewComment('')
    setCommentMessage('')
  }

  return (
    <div className="dashboard">
      <Navbar />

      <div className="dashboard-content">
        <h1>Support Ticket Dashboard</h1>

        <p>Manage your support requests in one place.</p>

        {message && (
          <p className="dashboard-message">
            {message}
          </p>
        )}

        {/* Customer ticket creation form */}
        {role === 'customer' && (
          <div className="create-ticket-section">
            <h2>Create a New Ticket</h2>

            <form
              className="ticket-form"
              onSubmit={handleCreateTicket}
            >
              <label>Subject</label>

              <input
                type="text"
                placeholder="Enter ticket subject"
                value={subject}
                onChange={(e) =>
                  setSubject(e.target.value)
                }
                required
              />

              <label>Description</label>

              <textarea
                placeholder="Describe your problem"
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                required
              />

              <label>Priority</label>

              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value)
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              <button type="submit">
                Create Ticket
              </button>
            </form>
          </div>
        )}

        {/* Selected ticket details and comments */}
        {selectedTicket && (
          <div className="ticket-details-section">
            <h2>
              Ticket #{selectedTicket.id} Details
            </h2>

            <p>
              <strong>Subject:</strong>{' '}
              {selectedTicket.subject}
            </p>

            <p>
              <strong>Description:</strong>{' '}
              {selectedTicket.description}
            </p>

            <p>
              <strong>Status:</strong>{' '}
              {selectedTicket.status}
            </p>

            <p>
              <strong>Priority:</strong>{' '}
              {selectedTicket.priority}
            </p>

            <hr />

            <h3>Comments</h3>

            {commentsLoading ? (
              <p>Loading comments...</p>
            ) : comments.length === 0 ? (
              <p>No comments yet. Be the first to comment.</p>
            ) : (
              <div className="comments-list">
                {comments.map((comment) => (
                  <div
                    className="comment-item"
                    key={comment.id}
                  >
                    <p>
                      <strong>
                        {comment.user_name || 'User'}
                      </strong>
                    </p>

                    <p>{comment.comment}</p>

                    <small>
                      {comment.created_at
                        ? new Date(
                            comment.created_at,
                          ).toLocaleString()
                        : ''}
                    </small>
                  </div>
                ))}
              </div>
            )}

            {commentMessage && (
              <p className="dashboard-message">
                {commentMessage}
              </p>
            )}

            {/* Customer and agent can add comments */}
            <form
              className="comment-form"
              onSubmit={handleAddComment}
            >
              <label>Add a Comment</label>

              <textarea
                placeholder="Write your comment here..."
                value={newComment}
                onChange={(e) =>
                  setNewComment(e.target.value)
                }
                required
              />

              <button
                type="submit"
                disabled={commentSubmitting}
              >
                {commentSubmitting
                  ? 'Adding Comment...'
                  : 'Add Comment'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleCloseDetails}
            >
              Close Details
            </button>
          </div>
        )}

        {/* Tickets list */}
        <div className="tickets-section">
          <h2>
            {role === 'agent'
              ? 'All Tickets'
              : 'My Tickets'}
          </h2>

          {loading ? (
            <p>Loading tickets...</p>
          ) : tickets.length === 0 ? (
            <p>No tickets found.</p>
          ) : (
            <div className="tickets-grid">
              {tickets.map((ticket) => (
                <div key={ticket.id}>
                  <TicketCard
                    ticket={ticket}
                    onView={handleView}
                  />

                  {role === 'agent' && (
                    <button
                      className="status-update-btn"
                      onClick={() =>
                        handleStatusChange(ticket)
                      }
                    >
                      Update Status
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard