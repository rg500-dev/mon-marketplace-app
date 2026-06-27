import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'

type Product = {
  id: string
  title: string
  description: string
  price: number
  image?: string
  condition: string
  status: string
  createdAt: string
  latitude?: number
  longitude?: number
  location?: string
  distance?: number
  category: { name: string }
  seller: { username: string; rating: number; verified?: boolean }
}

type Category = {
  id: string
  name: string
  slug: string
}

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [condition, setCondition] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [location, setLocation] = useState('')
  const [radius, setRadius] = useState('50')
  const [userLat, setUserLat] = useState('')
  const [userLng, setUserLng] = useState('')
  const [locating, setLocating] = useState(false)
  const [geoActive, setGeoActive] = useState(false)
  const [savingSearch, setSavingSearch] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories')
      setCategories(res.data.data)
    } catch (err) {
      console.error(err)
      setError('Impossible de charger les catégories.')
    }
  }

  const loadProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const params: any = {
        q: search || undefined,
        category: selectedCategory || undefined,
        condition: condition || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sort,
        location: location || undefined,
        lat: userLat || undefined,
        lng: userLng || undefined,
        radius: geoActive && radius ? radius : undefined,
      }
      const res = await api.get('/products', { params })
      setProducts(res.data.data)
    } catch (err) {
      console.error(err)
      setError('Impossible de charger les produits.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [selectedCategory, condition, sort])

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    loadProducts()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Tous les produits</h1>

      <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSearch} className="grid lg:grid-cols-4 gap-4">
          <input
            className="border rounded p-3"
            placeholder="Rechercher un produit, une marque..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border rounded p-3"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Toutes les catégories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            className="border rounded p-3"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          >
            <option value="">Tous les états</option>
            <option value="new">Neuf</option>
            <option value="like-new">Comme neuf</option>
            <option value="good">Bon état</option>
            <option value="fair">État correct</option>
          </select>
          <button className="bg-blue-600 text-white rounded-lg px-5 py-3 hover:bg-blue-700">Rechercher</button>
        </form>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <input
            type="number"
            className="border rounded p-3"
            placeholder="Prix min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <input
            type="number"
            className="border rounded p-3"
            placeholder="Prix max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
          <select
            className="border rounded p-3"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Les plus récents</option>
            <option value="oldest">Les plus anciens</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="distance" disabled={!geoActive}>Distance (proximité)</option>
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              className="border rounded p-3 w-20 flex-shrink-0"
              placeholder="Rayon"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              disabled={!geoActive}
            />
            <span className="flex items-center text-sm text-gray-500">km</span>
            <button
              type="button"
              onClick={() => {
                if (!navigator.geolocation) {
                  setError('La géolocalisation n\'est pas supportée')
                  return
                }
                if (geoActive) {
                  setGeoActive(false)
                  setUserLat('')
                  setUserLng('')
                  setLocation('')
                  return
                }
                setLocating(true)
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setUserLat(pos.coords.latitude.toString())
                    setUserLng(pos.coords.longitude.toString())
                    setGeoActive(true)
                    setLocation(`À proximité (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`)
                    setLocating(false)
                    loadProducts()
                  },
                  () => {
                    setError('Impossible d\'accéder à votre position')
                    setLocating(false)
                  }
                )
              }}
              disabled={locating}
              className={`px-3 py-2 rounded-lg border text-sm ${
                geoActive ? 'bg-green-100 border-green-500 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-700'
              }`}
            >
              {locating ? '🔄' : geoActive ? '✓' : '📍'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md h-fit">
          <h3 className="font-bold mb-4">Filtres actifs</h3>
          <div className="space-y-3">
            <div>
              <span className="block text-sm text-gray-600">Catégorie</span>
              <p>{selectedCategory ? categories.find((cat) => cat.id === selectedCategory)?.name : 'Toutes'}</p>
            </div>
            <div>
              <span className="block text-sm text-gray-600">État</span>
              <p>{condition || 'Tous'}</p>
            </div>
            <div>
              <span className="block text-sm text-gray-600">Prix</span>
              <p>{minPrice || '0'}€ - {maxPrice || '∞'}€</p>
            </div>
            <div>
              <span className="block text-sm text-gray-600">Localisation</span>
              {geoActive ? (
                <p className="text-green-600">{location || 'Position activée'} • {radius}km</p>
              ) : location ? (
                <p>{location}</p>
              ) : (
                <p className="text-gray-400">Non précisée</p>
              )}
            </div>
          </div>

          {user && (
            <div className="mt-6 pt-4 border-t">
              <button
                onClick={async () => {
                  if (savingSearch) return
                  setSavingSearch(true)
                  setSaveSuccess(false)
                  try {
                    await api.post('/saved-searches', {
                      query: search || undefined,
                      categoryId: selectedCategory || undefined,
                      minPrice: minPrice || undefined,
                      maxPrice: maxPrice || undefined,
                      condition: condition || undefined,
                      location: location || undefined,
                      latitude: userLat || undefined,
                      longitude: userLng || undefined,
                      radius: geoActive ? radius : undefined,
                    })
                    setSaveSuccess(true)
                    setTimeout(() => setSaveSuccess(false), 3000)
                  } catch (err) {
                    console.error(err)
                  } finally {
                    setSavingSearch(false)
                  }
                }}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  saveSuccess
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {savingSearch ? 'Sauvegarde...' : saveSuccess ? '✅ Recherche sauvegardée !' : '🔔 Sauvegarder cette recherche'}
              </button>
              <Link
                to="/saved-searches"
                className="block w-full text-center mt-2 text-xs text-blue-600 hover:underline"
              >
                Voir mes alertes →
              </Link>
            </div>
          )}
        </div>

        <div className="md:col-span-3">
          {loading ? (
            <div className="text-center py-20">Chargement des produits...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : products.length === 0 ? (
            <div className="text-gray-600">Aucun produit trouvé pour ce filtre.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                  <div className="bg-gray-100 h-48 flex items-center justify-center">
                    {product.image ? (
                      <img src={product.image} alt={product.title} className="h-full object-contain w-full" />
                    ) : (
                      <span className="text-gray-500">Image du produit</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2">{product.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{product.category?.name || 'Sans catégorie'}</p>
                    <p className="text-gray-600 text-sm mb-3">{product.description.slice(0, 90)}...</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-500">{product.seller.username}</span>
                      <span className="text-sm text-yellow-500">★ {product.seller.rating?.toFixed(1) ?? '0.0'}</span>
                    </div>
                    {product.distance != null && (
                      <p className="text-xs text-gray-500 mb-2">📍 À {product.distance} km</p>
                    )}
                    {product.location && !product.distance && (
                      <p className="text-xs text-gray-500 mb-2">📍 {product.location}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-600">{product.price.toFixed(2)}€</span>
                      <Link to={`/products/${product.id}`} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                        Voir
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
