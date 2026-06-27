import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
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
  category: { name: string }
  seller: { id: string; username: string; avatar?: string; rating: number; verified?: boolean; location?: string }
  reviews: Array<{ id: string; rating: number; comment?: string; createdAt: string; author: { id: string; username: string } }>
}

type Offer = {
  id: string
  amount: number
  message?: string
  status: string
  counterAmount?: number
  counterMessage?: string
  buyer: { id: string; username: string }
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerMessage, setOfferMessage] = useState('')
  const [offerError, setOfferError] = useState('')
  const [submittingOffer, setSubmittingOffer] = useState(false)
  const [myOffer, setMyOffer] = useState<Offer | null>(null)

  const loadProduct = async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const res = await api.get(`/products/${id}`)
      setProduct(res.data.data)
    } catch (err) {
      console.error(err)
      setError('Impossible de charger le produit.')
    } finally {
      setLoading(false)
    }
  }

  const loadMyOffer = async () => {
    if (!id || !user) return
    try {
      const res = await api.get(`/offers/${id}`)
      const offers = res.data.data
      if (offers.length > 0) {
        setMyOffer(offers[0])
        setOfferAmount(offers[0].amount.toString())
      }
    } catch {
      // No offer found
    }
  }

  useEffect(() => {
    loadProduct()
  }, [id])

  useEffect(() => {
    loadMyOffer()
  }, [id, user])

  const submitReview = async () => {
    if (!product) return
    setReviewError('')
    setSubmittingReview(true)
    try {
      await api.post('/reviews', { productId: product.id, rating, comment })
      setComment('')
      await loadProduct()
    } catch (err: any) {
      setReviewError(err?.response?.data?.error || 'Impossible d\'envoyer l\'évaluation.')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-12">Chargement du produit...</div>
  if (error) return <div className="max-w-7xl mx-auto px-4 py-12 text-red-600">{error}</div>
  if (!product) return <div className="max-w-7xl mx-auto px-4 py-12">Produit introuvable.</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-6">
        <Link to="/products" className="text-blue-600 hover:underline">
          ← Retour aux annonces
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gray-100 h-80 flex items-center justify-center">
            {product.image ? (
              <img src={product.image} alt={product.title} className="h-full w-full object-contain" />
            ) : (
              <span className="text-gray-500">Aucune image</span>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              <p className="text-sm text-gray-500">Catégorie: {product.category?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold text-blue-600">{product.price.toFixed(2)}€</p>
              <p className="text-sm text-gray-500">{product.condition}</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700">{product.description}</p>
          </div>

          {product.location && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800">📍 Localisation</p>
              <p className="text-blue-700">{product.location}</p>
              {product.latitude && product.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${product.latitude},${product.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                >
                  Voir sur Google Maps →
                </a>
              )}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-500">Vendeur</p>
              <Link to={`/profile/${product.seller.id}`} className="block text-lg font-semibold text-blue-600 hover:underline">
                {product.seller.username}
              </Link>
              <p className="text-sm text-gray-500">Note: {product.seller.rating?.toFixed(1) ?? '0.0'}</p>
              {product.seller.verified && <span className="text-sm text-green-600">Compte vérifié</span>}
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-500">Statut</p>
              <p className="text-gray-800 capitalize">{product.status}</p>
              <p className="text-sm text-gray-500">Publié le {new Date(product.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {user ? (
            <div className="space-y-3 mb-6">
              <p className="text-gray-700">Envoyez un message au vendeur pour en savoir plus.</p>
              <div className="flex flex-wrap gap-3">
                {product.status === 'active' && (
                  <button
                    onClick={() => navigate(`/checkout/${product.id}`)}
                    className="inline-block bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700 font-medium"
                  >
                    💳 Acheter maintenant
                  </button>
                )}
                <Link to="/messages" className="inline-block bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700">
                  Ouvrir la messagerie
                </Link>
                <Link
                  to={`/report?productId=${product.id}`}
                  className="inline-block bg-amber-500 text-white px-5 py-3 rounded-lg hover:bg-amber-600"
                >
                  Signaler ce produit
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-100 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="font-semibold">Vous devez être connecté pour contacter le vendeur.</p>
              <Link to="/login" className="text-blue-600 hover:underline">
                Connectez-vous maintenant
              </Link>
            </div>
          )}

          {/* Section Offre / Négociation */}
          {user && user.username !== product.seller.username && product.status === 'active' && (
            <div className="mb-6 p-4 bg-white rounded-lg border">
              <h3 className="text-lg font-bold mb-3">💬 Faire une offre</h3>

              {!myOffer || myOffer.status === 'declined' || myOffer.status === 'cancelled' ? (
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  setOfferError('')
                  if (!offerAmount || parseFloat(offerAmount) <= 0) {
                    setOfferError('Montant invalide')
                    return
                  }
                  setSubmittingOffer(true)
                  try {
                    const res = await api.post('/offers', {
                      productId: product.id,
                      amount: offerAmount,
                      message: offerMessage,
                    })
                    setMyOffer(res.data.data)
                    setOfferError('')
                  } catch (err: any) {
                    setOfferError(err?.response?.data?.error || 'Erreur lors de l\'envoi')
                  } finally {
                    setSubmittingOffer(false)
                  }
                }}>
                  <div className="grid sm:grid-cols-2 gap-3 mb-3">
                    <input
                      type="number"
                      step="0.01"
                      className="border rounded p-3"
                      placeholder="Votre prix (€)"
                      value={offerAmount}
                      onChange={(e) => setOfferAmount(e.target.value)}
                    />
                    <input
                      className="border rounded p-3"
                      placeholder="Message (optionnel)"
                      value={offerMessage}
                      onChange={(e) => setOfferMessage(e.target.value)}
                    />
                  </div>
                  {offerError && <p className="text-red-600 text-sm mb-2">{offerError}</p>}
                  <button type="submit" disabled={submittingOffer} className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700">
                    {submittingOffer ? 'Envoi...' : `Faire une offre`}
                  </button>
                </form>
              ) : myOffer.status === 'pending' ? (
                <div>
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-3">
                    <p className="text-yellow-800 font-medium">Offre en attente</p>
                    <p className="text-yellow-700">Votre offre de <strong>{myOffer.amount}€</strong> est en cours d'examen</p>
                    {myOffer.message && <p className="text-yellow-600 text-sm mt-1">Message : {myOffer.message}</p>}
                  </div>
                  <button onClick={async () => {
                    try {
                      await api.patch(`/offers/${myOffer.id}/cancel`)
                      setMyOffer({ ...myOffer, status: 'cancelled' })
                    } catch {}
                  }} className="text-sm text-red-600 hover:underline">
                    Annuler l'offre
                  </button>
                </div>
              ) : myOffer.status === 'counter' ? (
                <div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                    <p className="text-blue-800 font-medium">🔄 Contre-offre reçue</p>
                    <p className="text-blue-700">Le vendeur propose <strong>{myOffer.counterAmount}€</strong> (votre offre : {myOffer.amount}€)</p>
                    {myOffer.counterMessage && <p className="text-blue-600 text-sm mt-1">Message: {myOffer.counterMessage}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      try {
                        await api.patch(`/offers/${myOffer.id}/accept-counter`)
                        setMyOffer({ ...myOffer, status: 'accepted' })
                      } catch {}
                    }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                      ✅ Accepter à {myOffer.counterAmount}€
                    </button>
                    <button onClick={async () => {
                      try {
                        await api.patch(`/offers/${myOffer.id}/cancel`)
                        setMyOffer({ ...myOffer, status: 'cancelled' })
                      } catch {}
                    }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm">
                      Refuser
                    </button>
                  </div>
                </div>
              ) : myOffer.status === 'accepted' ? (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-green-800 font-bold">✔ Offre acceptée !</p>
                  <p className="text-green-700">Prix convenu : <strong>{myOffer.counterAmount || myOffer.amount}€</strong></p>
                  <p className="text-green-600 text-sm">Le vendeur vous contactera pour finaliser la transaction.</p>
                </div>
              ) : myOffer.status === 'declined' ? (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <p className="text-red-800 font-medium">✖ Offre refusée</p>
                  <p className="text-red-700">Votre offre de {myOffer.amount}€ a été refusée.</p>
                  <button onClick={() => setMyOffer(null)} className="text-sm text-blue-600 hover:underline mt-2">
                    Faire une nouvelle offre
                  </button>
                </div>
              ) : null}
            </div>
          )}

          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Évaluations</h2>
            {product.reviews.length === 0 ? (
              <p className="text-gray-600">Aucune évaluation pour ce produit.</p>
            ) : (
              <div className="space-y-4">
                {product.reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{review.author.username}</span>
                      <span className="text-yellow-500">★ {review.rating}</span>
                    </div>
                    <p className="text-gray-700">{review.comment || 'Aucun commentaire'}</p>
                    <p className="text-xs text-gray-500 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {user && user.username !== product.seller.username && (
            <div className="mt-6 bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Ajouter une évaluation</h2>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Note</span>
                  <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="mt-1 block w-full rounded border p-2">
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>{value} étoiles</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Commentaire</span>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-1 w-full rounded border p-2"
                  />
                </label>
              </div>
              {reviewError && <div className="text-red-600 mb-4">{reviewError}</div>}
              <button onClick={submitReview} disabled={submittingReview} className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700">
                {submittingReview ? 'Envoi...' : 'Publier l\'évaluation'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}