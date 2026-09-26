
import React from 'react'
import { useNavigate } from 'react-router-dom'

const Navbar = () => {
  const navigate = useNavigate()

  const userName = localStorage.getItem('userName')
  const userRole = localStorage.getItem('userRole')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
    localStorage.removeItem('userRole')

    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h2>SupportDesk</h2>
      </div>

      <div className="navbar-right">
        <span className="navbar-user">
          {userName || 'User'}
          {userRole && ` (${userRole})`}
        </span>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar