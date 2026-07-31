import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

export default function useAuth() {
  const navigate = useNavigate()

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('tinyfix_user') || '{}')
    } catch {
      return {}
    }
  }, [])

  const token = localStorage.getItem('tinyfix_token')
  const isAuthenticated = !!token

  const logout = useCallback(() => {
    localStorage.removeItem('tinyfix_token')
    localStorage.removeItem('tinyfix_user')
    navigate('/login')
  }, [navigate])

  return { user, token, isAuthenticated, logout }
}
