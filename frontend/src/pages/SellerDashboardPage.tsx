import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'

type SellerStats = {
  products: { total: number; active: number; sold: number; views: number }
  revenue: { total: number; monthly: Record<string, number> }
  offers: { total: number; pending: number }
  reviews: { total: number; average: number }
  recentProducts: Array<{ id: string; title: string; price: number; status: string; createdAt: string; category: { name: string } }>
  topProducts: Array<{ id: string; title: string; views: number; price: number }>
}

export default function SellerDashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<SellerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    const loadStats = async () => {
      try {
        const res = await api.get('/seller/stats')
        setStats(res.data.data)
      } catch (err) {
        setError('Impossible de charger les statistiques.')
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [user])

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Tableau de bord</h1>
        <p className="text-gray-700">Connectez-vous pour voir vos statistiques.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de vos statistiques...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      </div>
    )
  }

  if (!stats) return null

  // Mois en français
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  const monthlyData = Object.entries(stats.revenue.monthly).slice(-6)

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">📊 Tableau de bord</h1>
          <p className="text-gray-500 mt-1">Bienvenue, {user.username}</p>
        </div>
        <Link
          to="/products/new"
          className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 font-medium"
        >
          + Nouvelle annonce
        </Link>
      </div>

      {/* Cartes statistiques */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Annonces</span>
            <span className="text-2xl">📦</span>
          </div>
          <p className="text-3xl font-bold">{stats.products.total}</p>
          <div className="flex gap-3 mt-2 text-xs text-gray-500">
            <span className="text-green-600">{stats.products.active} actives</span>
            <span className="text-blue-600">{stats.products.sold} vendues</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Vues totales</span>
            <span className="text-2xl">👁️</span>
          </div>
          <p className="text-3xl font-bold">{stats.products.views.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">Sur toutes vos annonces</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Revenus</span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.revenue.total.toFixed(2)}€</p>
          <p className="text-xs text-gray-500 mt-2">Offres acceptées</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Évaluations</span>
            <span className="text-2xl">⭐</span>
          </div>
          <p className="text-3xl font-bold">{stats.reviews.average.toFixed(1)}</p>
          <div className="flex gap-3 mt-2 text-xs text-gray-500">
            <span>{stats.reviews.total} avis</span>
            <span className="text-yellow-500">{'★'.repeat(Math.round(stats.reviews.average))}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Graphique des ventes mensuelles */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Ventes mensuelles</h2>
          {monthlyData.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucune vente pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {monthlyData.map(([month, amount]) => {
                const [year, m] = month.split('-')
                const label = `${monthNames[parseInt(m) - 1]} ${year}`
                const maxAmount = Math.max(...monthlyData.map(([, a]) => a))
                const width = maxAmount > 0 ? (amount / maxAmount) * 100 : 0
                return (
                  <div key={month}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-semibold">{amount.toFixed(2)}€</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Offres en attente */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Offres reçues</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.offers.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="flex-1 bg-yellow-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.offers.pending}</p>
              <p className="text-xs text-gray-500">En attente</p>
            </div>
          </div>
          <Link
            to="/offers"
            className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            Voir toutes les offres →
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Produits les plus vus */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">🔥 Produits les plus vus</h2>
          {stats.topProducts.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun produit pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.map((product, index) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-sm">{product.title}</p>
                      <p className="text-xs text-gray-500">{product.price.toFixed(2)}€</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">{product.views}</p>
                    <p className="text-xs text-gray-500">vues</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Produits récents */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">📋 Dernières annonces</h2>
          {stats.recentProducts.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucune annonce pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div>
                    <p className="font-medium text-sm">{product.title}</p>
                    <p className="text-xs text-gray-500">
                      {product.category?.name} • {new Date(product.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{product.price.toFixed(2)}€</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      product.status === 'active' ? 'bg-green-100 text-green-700' :
                      product.status === 'sold' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {product.status === 'active' ? 'Active' : product.status === 'sold' ? 'Vendue' : product.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}