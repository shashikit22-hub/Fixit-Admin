import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

export default function useAuth() {
  const navigate = useNavigate()

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('fixit_user') || '{}')
    } catch {
      return {}
    }
  }, [])

  const token = localStorage.getItem('fixit_token')
  const isAuthenticated = !!token

  const logout = useCallback(() => {
    localStorage.removeItem('fixit_token')
    localStorage.removeItem('fixit_user')
    navigate('/login')
  }, [navigate])

  return { user, token, isAuthenticated, logout }
}
