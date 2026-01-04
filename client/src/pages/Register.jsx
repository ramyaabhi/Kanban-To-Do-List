import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../index.css'

function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Registration successful! Redirecting...')
        //login(data.token, data.user)
        setTimeout(() => {
          navigate('/login')
        }, 1000)
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    }
  }

  return (
    <div className="container">
      <div className="auth-card">
        <h1>✨ Register</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password (min 6 characters)"
              required
              autoComplete="new-password"
              minLength="6"
            />
          </div>
          {error && (
            <div className="error-message" style={{ display: 'block' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="success-message" style={{ display: 'block' }}>
              {success}
            </div>
          )}
          <button type="submit" className="auth-btn">Register</button>
          <p className="auth-link">
            Already have an account? <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login') }}>Login here</a>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Register

