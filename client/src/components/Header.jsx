import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Settings, FileText, Plus, BarChart3, User, Bell } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import euroformLogo from '../assets/euroform_logo.svg'

const Header = () => {
  const { user } = useAuth()
  const location = useLocation()
  const navRefs = useRef({})
  const [activeNavPosition, setActiveNavPosition] = useState({ left: 0, width: 0 })

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Submissions', href: '/submissions', icon: FileText },
  ]

  const isActive = (href) => location.pathname === href

  useEffect(() => {
    const activeNav = navigation.find(nav => isActive(nav.href))
    if (activeNav && navRefs.current[activeNav.href]) {
      const element = navRefs.current[activeNav.href]
      const rect = element.getBoundingClientRect()
      const containerRect = element.closest('header').getBoundingClientRect()
      setActiveNavPosition({
        left: rect.left - containerRect.left,
        width: rect.width
      })
    }
  }, [location.pathname])

  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm" style={{ backgroundColor: 'var(--primary-bg)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center group py-4">
              <img 
                src={euroformLogo} 
                alt="euroform logo" 
                className="h-5"
              />
            </Link>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8 h-full">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  ref={(el) => navRefs.current[item.href] = el}
                  className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Right Side - Profile and Actions */}
          <div className="flex items-center space-x-4 py-4">
            <Link to="/forms/create" className="btn-primary">
              + New Form
            </Link>
            
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
              <Bell className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            </button>
            
            <Link 
              to="/settings" 
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
            </Link>
            
            <div className="profile-section">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-normal hidden sm:block" style={{ color: 'var(--text-primary)' }}>
                {user?.email?.split('@')[0] || 'User'}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Integrated border with active nav underline */}
      <div className="w-full h-px relative" style={{ backgroundColor: 'var(--border-color)' }}>
        {activeNavPosition.width > 0 && (
          <div
            className="absolute top-0 h-full transition-all duration-200"
            style={{
              left: `${activeNavPosition.left}px`,
              width: `${activeNavPosition.width}px`,
              backgroundColor: 'var(--text-primary)'
            }}
          ></div>
        )}
      </div>
    </header>
  )
}

export default Header
