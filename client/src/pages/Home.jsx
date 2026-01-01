import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../index.css'
import TaskWaveLogo from '../../assets/taskwave-logo.svg'
import TaskWaveMark from '../../assets/taskwave-mark.svg'

function Home() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const openApp = () => {
    if (isAuthenticated) navigate('/app')
    else navigate('/login')
  }

  return (
    <div className="container">
      <div className="home-hero">
        <div className="brand-home">
          <img src={TaskWaveLogo} alt="TaskWave logo" className="brand-logo"/>
          <div>
            <h1>TaskWave</h1>
            <p className="tagline">Organize your tasks visually — simple, fast, productive.</p>
          </div>
        </div>

        <div className="home-cta">
          <button className="auth-btn" onClick={openApp}>Open App</button>
          <button className="secondary-btn" onClick={() => navigate('/register')}>Get Started</button>
        </div>

        <div className="features">
          <div className="feature">
            <h3>⚡ Quick Add</h3>
            <p>Add tasks quickly and stay focused.</p>
          </div>
          <div className="feature">
            <h3>🔒 Secure</h3>
            <p>Your data stays local to the demo server.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
