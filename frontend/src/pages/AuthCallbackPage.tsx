import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    const completeAuth = async () => {
      const token = searchParams.get('token')
      const userStr = searchParams.get('user')

      if (token && userStr) {
        try {
          const user = JSON.parse(decodeURIComponent(userStr))
          login(token, user)
          navigate('/products', { replace: true })
        } catch {
          setError('Erreur lors de la connexion sociale')
        }
      } else {
        setError('Paramètres d\'authentification manquants')
      }
    }

    completeAuth()
  }, [])

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 text-blue-600 hover:underline"
        >
          ← Retour à la connexion
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Connexion en cours...</p>
    </div>
  )
}