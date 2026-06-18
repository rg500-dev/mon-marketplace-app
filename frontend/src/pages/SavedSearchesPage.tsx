import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'

export default function SavedSearchesPage() {
  const { user } = useAuth()
  const [searches, setSearches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSearches = async () => {
    setError('')
    try {
      const res = await api.get('/saved-searches')
      setSearches(res.data.data || [])
    } catch (err) {
      console.error(err)
      setError('Impossible de charger les alertes.')
    } finally {
      setLoading(false)
    }
  }

  const deleteSearch = async (id: string) => {
    try {
      await api.delete(`/saved-searches/${id}`)
      setSearches(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const toggleNotify = async (id: string) => {
    try {
      const res = await api.patch(`/saved-searches/${id}/toggle`)
      setSearches(prev => prev.map(s => s.id === id ? res.data.data : s))
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (!user) return
    loadSearches()
  }, [user])

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Mes alertes</h1>
        <p className="text-gray-700">Connectez-vous pour gérer vos alertes de recherche.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🔔 Mes alertes</h1>
        <Link
          to="/products"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          + Nouvelle recherche
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      ) : searches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold mb-2">Aucune alerte</h2>
          <p className="text-gray-600 mb-6">
            Sauvegardez une recherche pour être notifié dès qu'un nouveau produit correspond.
          </p>
          <Link
            to="/products"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Parcourir les annonces
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {searches.map((search: any) => {
            // Construire le lien de recherche
            const params = new URLSearchParams()
            if (search.query) params.set('q', search.query)
            if (search.categoryId) params.set('category', search.categoryId)
            if (search.minPrice) params.set('minPrice', search.minPrice)
            if (search.maxPrice) params.set('maxPrice', search.maxPrice)
            if (search.condition) params.set('condition', search.condition)
            if (search.location) params.set('location', search.location)
            const searchLink = `/products?${params.toString()}`

            return (
              <div key={search.id} className="bg-white p-5 rounded-lg shadow-md border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link to={searchLink} className="text-lg font-semibold text-blue-600 hover:underline">
                      {search.query || 'Tous les produits'}
                    </Link>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {search.categoryId && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                          Catégorie: {search.categoryId}
                        </span>
                      )}
                      {search.minPrice && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                          Min: {search.minPrice}€
                        </span>
                      )}
                      {search.maxPrice && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                          Max: {search.maxPrice}€
                        </span>
                      )}
                      {search.condition && (
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                          {search.condition}
                        </span>
                      )}
                      {search.location && (
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">
                          📍 {search.location}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Créée le {new Date(search.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleNotify(search.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        search.notify
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title={search.notify ? 'Notifications activées' : 'Notifications désactivées'}
                    >
                      {search.notify ? '🔔 Activé' : '🔕 Désactivé'}
                    </button>
                    <button
                      onClick={() => deleteSearch(search.id)}
                      className="px-3 py-1.5 rounded-lg text-sm bg-red-100 text-red-600 hover:bg-red-200"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}