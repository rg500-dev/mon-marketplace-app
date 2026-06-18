import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'

type OfferItem = {
  id: string
  amount: number
  message?: string
  status: string
  counterAmount?: number
  counterMessage?: string
  createdAt: string
  buyer?: { id: string; username: string; avatar?: string }
  product: {
    id: string
    title: string
    price: number
    image?: string
    status: string
    seller: { id: string; username: string; avatar?: string }
  }
}

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
    counter: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-gray-100 text-gray-500',
  }
  const labels: Record<string, string> = {
    pending: 'En attente',
    accepted: 'Acceptée',
    declined: 'Refusée',
    counter: 'Contre-offre',
    cancelled: 'Annulée',
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  )
}

export default function OffersPage() {
  const { user } = useAuth()
  const [sent, setSent] = useState<OfferItem[]>([])
  const [received, setReceived] = useState<OfferItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent')
  const [counterInputs, setCounterInputs] = useState<Record<string, { amount: string; message: string }>>({})

  const loadOffers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/offers')
      setSent(res.data.data.sent)
      setReceived(res.data.data.received)
    } catch (err) {
      console.error(err)
      setError('Impossible de charger les offres.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadOffers()
  }, [user])

  const handleAction = async (offerId: string, action: string, extra?: Record<string, any>) => {
    try {
      await api.patch(`/offers/${offerId}/${action}`, extra || {})
      await loadOffers()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erreur')
    }
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-12">Chargement des offres...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Mes offres</h1>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('sent')}
          className={`pb-3 px-4 font-medium ${activeTab === 'sent' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          Offres envoyées ({sent.length})
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={`pb-3 px-4 font-medium ${activeTab === 'received' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          Offres reçues ({received.length})
        </button>
      </div>

      {/* Sent Offers */}
      {activeTab === 'sent' && (
        <>
          {sent.length === 0 ? (
            <p className="text-gray-500">Vous n'avez envoyé aucune offre.</p>
          ) : (
            <div className="space-y-4">
              {sent.map((offer) => (
                <div key={offer.id} className="bg-white p-4 rounded-lg shadow-md border">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                      {offer.product.image ? (
                        <img src={offer.product.image} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-xs text-gray-400">📷</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link to={`/products/${offer.product.id}`} className="font-bold text-blue-600 hover:underline">
                            {offer.product.title}
                          </Link>
                          <p className="text-sm text-gray-500">Vendeur: {offer.product.seller.username}</p>
                        </div>
                        <div className="text-right"><StatusBadge status={offer.status} /></div>
                      </div>
                      <div className="mt-2 grid sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Prix initial:</span>{' '}
                          <span className="line-through">{offer.product.price}€</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Mon offre:</span>{' '}
                          <span className="font-bold text-green-600">{offer.amount}€</span>
                        </div>
                        {offer.status === 'counter' && offer.counterAmount && (
                          <div>
                            <span className="text-gray-500">Contre-offre:</span>{' '}
                            <span className="font-bold text-blue-600">{offer.counterAmount}€</span>
                          </div>
                        )}
                      </div>
                      {offer.message && <p className="text-sm text-gray-500 mt-1">📝 {offer.message}</p>}
                      {offer.counterMessage && <p className="text-sm text-blue-500 mt-1">💬 {offer.counterMessage}</p>}
                      <div className="mt-3 flex gap-2">
                        {offer.status === 'counter' && (
                          <>
                            <button
                              onClick={() => handleAction(offer.id, 'accept-counter')}
                              className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700"
                            >
                              ✅ Accepter à {offer.counterAmount}€
                            </button>
                            <button
                              onClick={() => handleAction(offer.id, 'cancel')}
                              className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded text-sm hover:bg-gray-300"
                            >
                              Refuser
                            </button>
                          </>
                        )}
                        {(offer.status === 'pending') && (
                          <button
                            onClick={() => handleAction(offer.id, 'cancel')}
                            className="text-red-600 text-sm hover:underline"
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(offer.createdAt).toLocaleDateString()} à {new Date(offer.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Received Offers */}
      {activeTab === 'received' && (
        <>
          {received.length === 0 ? (
            <p className="text-gray-500">Vous n'avez reçu aucune offre.</p>
          ) : (
            <div className="space-y-4">
              {received.map((offer) => (
                <div key={offer.id} className="bg-white p-4 rounded-lg shadow-md border">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                      {offer.product.image ? (
                        <img src={offer.product.image} alt="" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-xs text-gray-400">📷</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link to={`/products/${offer.product.id}`} className="font-bold text-blue-600 hover:underline">
                            {offer.product.title}
                          </Link>
                          <p className="text-sm text-gray-500">
                            De: {offer.buyer?.username || 'Anonyme'}
                          </p>
                        </div>
                        <div className="text-right"><StatusBadge status={offer.status} /></div>
                      </div>
                      <div className="mt-2 grid sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Prix:</span>{' '}
                          <span className="line-through">{offer.product.price}€</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Offre:</span>{' '}
                          <span className="font-bold text-green-600">{offer.amount}€</span>
                        </div>
                      </div>
                      {offer.message && <p className="text-sm text-gray-500 mt-1">📝 {offer.message}</p>}

                      {offer.status === 'pending' && (
                        <div className="mt-3 space-y-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(offer.id, 'accept')}
                              className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700"
                            >
                              ✅ Accepter {offer.amount}€
                            </button>
                            <button
                              onClick={() => handleAction(offer.id, 'decline')}
                              className="bg-red-500 text-white px-4 py-1.5 rounded text-sm hover:bg-red-600"
                            >
                              ✖ Refuser
                            </button>
                          </div>
                          <div className="flex gap-2 items-end">
                            <div>
                              <input
                                type="number"
                                step="0.01"
                                className="border rounded p-2 w-28 text-sm"
                                placeholder="Contre-offre €"
                                value={counterInputs[offer.id]?.amount || ''}
                                onChange={(e) =>
                                  setCounterInputs((prev) => ({
                                    ...prev,
                                    [offer.id]: { amount: e.target.value, message: prev[offer.id]?.message || '' },
                                  }))
                                }
                              />
                              <input
                                type="text"
                                className="border rounded p-2 w-40 text-sm mt-1"
                                placeholder="Message (optionnel)"
                                value={counterInputs[offer.id]?.message || ''}
                                onChange={(e) =>
                                  setCounterInputs((prev) => ({
                                    ...prev,
                                    [offer.id]: { amount: prev[offer.id]?.amount || '', message: e.target.value },
                                  }))
                                }
                              />
                            </div>
                            <button
                              onClick={() =>
                                handleAction(offer.id, 'counter', {
                                  counterAmount: counterInputs[offer.id]?.amount,
                                  counterMessage: counterInputs[offer.id]?.message,
                                })
                              }
                              disabled={!counterInputs[offer.id]?.amount}
                              className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 disabled:bg-gray-300"
                            >
                              💬 Contre-offre
                            </button>
                          </div>
                        </div>
                      )}

                      {offer.status === 'accepted' && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                          ✔ Offre acceptée à {offer.amount}€
                        </div>
                      )}

                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(offer.createdAt).toLocaleDateString()} à {new Date(offer.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}