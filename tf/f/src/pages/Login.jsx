import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'
import abuneImg from '../assets/abuneselama.jpg'
import tekleImg  from '../assets/teklesawiros.jpg'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername]         = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)

  const handleLogin = async () => {
    if (!username || !password) {
      setError('እባክዎ የተጠቃሚ ስም እና የምስጢር ቃል ያስገቡ')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await login(username, password)
      if (res.data && res.data.username) {
        // Store Basic Auth credentials (username:password base64)
        localStorage.setItem('basicAuth', btoa(`${username}:${password}`))
        localStorage.setItem('adminUsername', res.data.username)
        localStorage.setItem('adminId', res.data.id)
        localStorage.setItem('adminRole', res.data.role)
        localStorage.setItem('adminNumber', res.data.adminNumber || '')
        localStorage.setItem('adminFullName', res.data.fullName || '')
        navigate('/dashboard')
      } else {
        setError('የተጠቃሚ ስም ወይም የምስጢር ቃል ትክክል አይደለም')
      }
    } catch (e) {
      setError('የተጠቃሚ ስም ወይም የምስጢር ቃል ትክክል አይደለም')
    } finally {
      setLoading(false)
    }
  }

  const handleKey = e => { if (e.key === 'Enter') handleLogin() }

  return (
    <div className="login-page">
      <div className="login-bg-pattern" />

      <header className="login-header">
        <img src={abuneImg} alt="አቡነ ሰላማ" className="login-header-img" />
        <div className="login-header-text">
          <div className="login-header-title">
            በማኅደረ ስብሐት ቅድስት ልደታ ለማርያም እና ደብረ መድኃኒት
          </div>
          <div className="login-header-title">
            መድኃኔዓለም ቤተ ክርስቲያን
          </div>
          <div className="login-header-sub">
            አቡነ ሰላማ ከሳቴ ብርሃን  ጉባኤ ቤት| Student Management System
          </div>
        </div>
        <img src={tekleImg} alt="ተክለ ሳዊሮስ" className="login-header-img" />
      </header>

      <div className="login-divider" />

      <div className="login-wrap">
        <div className="login-box">
          <div className="login-cross">†</div>
          <h2 className="login-title">ይግቡ</h2>
          <p className="login-sub">Admin Login</p>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label">የተጠቃሚ ስም / Username</label>
            <input
              className="form-input"
              type="text"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={handleKey}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }}>
            <label className="form-label">የምስጢር ቃል / Password</label>
            <input
              className="form-input"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKey}
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              aria-label={showPassword ? 'የይለፍ ቃል ደብቅ' : 'የይለፍ ቃል አሳይ'}
              onClick={() => setShowPassword(p => !p)}
              style={{
                position: 'absolute', right: '12px', top: '30px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '18px', color: '#8B6545', padding: '0', lineHeight: '1',
              }}
            >
             
            </button>
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '15px' }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'በመግባት ላይ...' : '☩ ይግቡ'}
          </button>
        </div>
      </div>

      <footer className="login-footer">
        <p>© {new Date().getFullYear()} የተክለ ሳዊሮስ ሰንበት ት/ቤት — Student Management System</p>
      </footer>
    </div>
  )
}
