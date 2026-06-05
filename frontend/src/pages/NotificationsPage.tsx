import { useEffect, useState } from 'react'
import api from '../api'

type Notification = {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadNotifications = async () => {
    setError('')
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data.data)
    } catch (err) {
      console.error(err)
      setError('Impossible de charger les notifications.')
    } finally {
      setLoading(false)
    }
  }

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)))
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      {loading ? (
        <div className="text-gray-600">Chargement...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="text-gray-600">Aucune notification pour le moment.</div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div key={notification.id} className={`rounded-lg p-4 border ${notification.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-lg">{notification.title}</h2>
                  <p className="text-sm text-gray-600">{new Date(notification.createdAt).toLocaleString()}</p>
                </div>
                {!notification.read && (
                  <button onClick={() => markRead(notification.id)} className="text-blue-600 hover:underline">
                    Marquer comme lu
                  </button>
                )}
              </div>
              <p className="mt-3 text-gray-700">{notification.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
