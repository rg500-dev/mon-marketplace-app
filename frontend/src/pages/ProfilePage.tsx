import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'

type Profile = {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  phone?: string
  location?: string
  bio?: string
  rating?: number
  verified?: boolean
  role?: string
  isSuspended?: boolean
  totalProducts: number
  reviewCount: number
  averageRating: number
  products: Array<{ id: string; title: string; price: number; image?: string; category: { name: string } }>
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const { userId } = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      if (loading) return
      if (!user && !userId) return
      const targetId = userId || user?.id
      if (!targetId) return
      setLoadingProfile(true)
      setError('')
      try {
        const res = await api.get(`/users/${targetId}`)
        setProfile(res.data.data)
      } catch (err) {
        console.error(err)
        setError('Impossible de charger le profil.')
      } finally {
        setLoadingProfile(false)
      }
    }

    loadProfile()
  }, [loading, user, userId])

  if (loading || loadingProfile) {
    return <div className="max-w-7xl mx-auto px-4 py-12">Chargement du profil...</div>
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Profil</h1>
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Profil</h1>
        <p className="text-gray-700">Vous devez vous connecter pour voir le profil.</p>
        <Link to="/login" className="text-blue-600 hover:underline">
          Se connecter
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{profile.username}</h1>
          <p className="text-gray-500">{profile.role === 'admin' ? 'Administrateur' : 'Vendeur / Acheteur'}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center text-sm">
          {profile.verified ? (
            <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">Compte vérifié</span>
          ) : (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-800">Non vérifié</span>
          )}
          {profile.isSuspended && <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">Compte suspendu</span>}
          {profile.id !== user?.id && (
            <Link
              to={`/report?reportedUserId=${profile.id}`}
              className="rounded bg-amber-500 px-3 py-2 text-white hover:bg-amber-600"
            >
              Signaler cet utilisateur
            </Link>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Infos personnelles</h2>
          <p className="text-gray-700 mb-2"><strong>Email:</strong> {profile.email}</p>
          <p className="text-gray-700 mb-2"><strong>Prénom:</strong> {profile.firstName || 'Non renseigné'}</p>
          <p className="text-gray-700 mb-2"><strong>Nom:</strong> {profile.lastName || 'Non renseigné'}</p>
          <p className="text-gray-700 mb-2"><strong>Téléphone:</strong> {profile.phone || 'Non renseigné'}</p>
          <p className="text-gray-700 mb-2"><strong>Localisation:</strong> {profile.location || 'Non renseigné'}</p>
          <p className="text-gray-700 mb-2"><strong>Note moyenne:</strong> {profile.averageRating?.toFixed(1) ?? 'Aucune note'}</p>
          <p className="text-gray-700 mb-2"><strong>Nombre d’évaluations:</strong> {profile.reviewCount}</p>
          <p className="text-gray-700 mb-2"><strong>Produits actifs:</strong> {profile.totalProducts}</p>
        </div>
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">À propos</h2>
          <p className="text-gray-700 whitespace-pre-line">{profile.bio || 'Aucune description personnelle ajoutée.'}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Annonces du vendeur</h2>
        {profile.products.length === 0 ? (
          <p className="text-gray-600">Aucune annonce active pour le moment.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {profile.products.map((product) => (
              <Link key={product.id} to={`/products/${product.id}`} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
                <div className="bg-gray-100 h-40 flex items-center justify-center">
                  {product.image ? (
                    <img src={product.image} alt={product.title} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-gray-500">Aucune image</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{product.title}</h3>
                  <p className="text-sm text-gray-500">{product.category?.name}</p>
                  <p className="text-lg font-bold text-blue-600">{product.price.toFixed(2)}€</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
