
import React from 'react'

const TicketCard = ({ ticket, onView }) => {
  return (
    <div className="ticket-card">
      <div className="ticket-card-header">
        <h3>{ticket.subject}</h3>

        <span className={`ticket-status ${ticket.status}`}>
          {ticket.status?.replace('_', ' ')}
        </span>
      </div>

      <p className="ticket-description">
        {ticket.description}
      </p>

      <div className="ticket-details">
        <span>
          Priority: {' '}
          <strong className={`priority ${ticket.priority}`}>
            {ticket.priority}
          </strong>
        </span>

        <span>
          Ticket ID: #{ticket.id}
        </span>
      </div>

      <button
        className="view-ticket-btn"
        onClick={() => onView(ticket)}
      >
        View Details
      </button>
    </div>
  )
}

export default TicketCard