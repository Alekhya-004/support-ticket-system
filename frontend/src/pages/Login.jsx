
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
const Login = () => {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  
const handleLogin = async (e) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    const response = await fetch(
      'http://localhost:5000/api/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    )

    const data = await response.json()

    console.log('Login response:', data)

    if (!response.ok) {
      setError(data.message || 'Login failed')
      return
    }

    localStorage.setItem('token', data.token)
    localStorage.setItem('userName', data.user.name)
    localStorage.setItem('userRole', data.user.role)

    navigate('/')
  } catch (err) {
    console.error('Login error:', err)
    setError('Cannot connect to server. Check your backend.')
  } finally {
    setLoading(false)
  }
}
  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h1>SupportDesk</h1>
        <p>Login to your account</p>

        <label>Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p className="register-link">
          Don't have an account?{' '}
          <a href="/register">Register</a>
        </p>
      </form>
    </div>
  )
}

export default Login