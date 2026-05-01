import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null)

  const [token, setToken] = useState(null)

  useEffect(function() {

    const savedToken = localStorage.getItem('token')

    if (savedToken) {

      try {
        const payloadBase64 = savedToken.split('.')[1]
        const payloadString = atob(payloadBase64)
        const payload = JSON.parse(payloadString)

        const expiryTime = payload.exp * 1000
        const currentTime = Date.now()
        const isExpired = expiryTime < currentTime

        if (isExpired) {
          localStorage.removeItem('token')
        } else {
          setToken(savedToken)
          setUser({
            userId: payload.userId,
            email: payload.email,
            role: payload.role
          })
        }

      } catch (err) {
        localStorage.removeItem('token')
      }
    }

  }, []) 

  function login(newToken) {

    const payloadBase64 = newToken.split('.')[1]
    const payloadString = atob(payloadBase64)
    const payload = JSON.parse(payloadString)

    localStorage.setItem('token', newToken)

    setToken(newToken)
    setUser({
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    })
  }

  function logout() {
    localStorage.removeItem('token')

    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    token,
    isLoggedIn: !!token,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}