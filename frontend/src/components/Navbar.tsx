import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, logout, loading } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await api.get('/notifications')
        const unread = res.data.data.filter((item: any) => !item.read).length
        setUnreadCount(unread)
      } catch (err) {
        setUnreadCount(0)
      }
    }

    if (!loading && user) {
      loadNotifications()
    }
  }, [loading, user])

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-blue-600">Marketplace</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/products" className="text-gray-700 hover:text-blue-600">
              Parcourir
            </Link>
            <Link to="/messages" className="text-gray-700 hover:text-blue-600">
              Messages
            </Link>
            {!loading && user ? (
              <>
                <Link to="/products/new" className="text-gray-700 hover:text-blue-600">
                  Vendre
                </Link>
                <Link to="/notifications" className="relative text-gray-700 hover:text-blue-600">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-4 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-gray-700 hover:text-blue-600">
                    Admin
                  </Link>
                )}
                <Link to={`/profile/${user.id}`} className="text-gray-700 hover:text-blue-600">
                  {user.username}
                </Link>
                <button onClick={handleLogout} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">
                  Se déconnecter
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-blue-600">
                  Connexion
                </Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
