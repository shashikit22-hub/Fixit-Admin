import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdPerson, MdLock, MdVisibility, MdVisibilityOff, MdErrorOutline } from 'react-icons/md'
import Button from '../components/ui/Button'
import api from '../services/api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [touched, setTouched] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    const saved = localStorage.getItem('fixit_remember')
    if (saved) {
      setUsername(saved)
      setRememberMe(true)
    }
  }, [])

  const validate = () => {
    const errs = {}
    if (!username.trim()) errs.username = 'Username is required'
    else if (username.trim().length < 3) errs.username = 'Username must be at least 3 characters'
    if (!password) errs.password = 'Password is required'
    else if (password.length < 4) errs.password = 'Password must be at least 4 characters'
    return errs
  }

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    setErrors(validate())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    setTouched({ username: true, password: true })
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    setFormError('')
    try {
      const { data } = await api.post('/auth/login', { username: username.trim(), password })
      localStorage.setItem('fixit_token', data.token)
      localStorage.setItem('fixit_user', JSON.stringify({ username: data.username, role: data.role, fullName: data.fullName }))
      if (rememberMe) {
        localStorage.setItem('fixit_remember', username.trim())
      } else {
        localStorage.removeItem('fixit_remember')
      }
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid username or password'
      setFormError(msg)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field) =>
    `w-full pl-11 pr-4 py-3 border rounded-lg outline-none transition-colors text-sm focus-ring ${
      touched[field] && errors[field]
        ? 'border-red-400 bg-red-50/50'
        : 'border-gray-300 hover:border-gray-400 focus:border-atoll-500'
    }`

  return (
    <div className="min-h-dvh relative flex items-center justify-center sm:justify-start overflow-hidden">
      <img
        src={`${import.meta.env.BASE_URL}login-bg.png`}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="relative z-10 w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] max-w-md sm:max-w-lg mx-4 sm:mx-0 sm:ml-6 md:ml-12 lg:ml-20 xl:ml-28 my-4 animate-scaleIn">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 sm:p-8 md:p-10 border border-gray-200">
          <div className="text-center mb-8 animate-slideUp">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="TinyFix" className="h-16 sm:h-20 md:h-24 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Sign in to your admin account</p>
          </div>

          {formError && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2.5 animate-slideUp" role="alert">
              <MdErrorOutline size={20} className="flex-shrink-0 text-red-500" />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="animate-slideUp stagger-1">
              <label htmlFor="login-username" className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <div className="relative">
                <MdPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setFormError(''); if (touched.username) setErrors(validate()) }}
                  onBlur={() => handleBlur('username')}
                  className={inputClass('username')}
                  placeholder="Enter username"
                  autoComplete="username"
                  aria-invalid={touched.username && !!errors.username}
                  aria-describedby={touched.username && errors.username ? 'username-error' : undefined}
                />
              </div>
              {touched.username && errors.username && (
                <p id="username-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1 animate-slideUp" role="alert">
                  <MdErrorOutline size={14} /> {errors.username}
                </p>
              )}
            </div>

            <div className="animate-slideUp stagger-2">
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFormError(''); if (touched.password) setErrors(validate()) }}
                  onBlur={() => handleBlur('password')}
                  className={`${inputClass('password')} !pr-12`}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  aria-invalid={touched.password && !!errors.password}
                  aria-describedby={touched.password && errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 focus-ring rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p id="password-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1 animate-slideUp" role="alert">
                  <MdErrorOutline size={14} /> {errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 animate-slideUp stagger-3">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-atoll-600 focus:ring-atoll-500 cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">Remember username</label>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="animate-slideUp stagger-4 w-full py-3 rounded-lg"
              size="lg"
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
