
import React from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import './App.css'

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token')

  return token ? children : <Navigate to="/login" />
}

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token')

  return token ? <Navigate to="/" /> : children
}

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App