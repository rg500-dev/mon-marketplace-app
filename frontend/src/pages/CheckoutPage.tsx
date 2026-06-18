import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import CheckoutForm from '../components/CheckoutForm'
import api from '../api'

export default function CheckoutPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null>>(Promise.resolve(null))
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Charger le produit
  useEffect(() => {
    if (!productId) {
      setError('Aucun produit sélectionné')
      setLoading(false)
      return
    }

    const loadProduct = async () => {
      try {
        const res = await api.get(`/products/${productId}`)
        setProduct(res.data.data)

        // Initialiser Stripe avec la clé du .env
        const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
        if (pk) {
          setStripePromise(loadStripe(pk))
        }
      } catch (err) {
        setError('Produit introuvable')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [productId])

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true)
    // Optionnel : rediriger vers la page de succès après 2 secondes
    setTimeout(() => {
      navigate('/products')
    }, 3000)
  }

  const handlePaymentError = (err: string) => {
    setError(err)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
        <button
          onClick={() => navigate('/products')}
          className="mt-4 text-blue-600 hover:underline"
        >
          ← Retour aux produits
        </button>
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-600 mb-2">Paiement réussi !</h1>
          <p className="text-gray-600 mb-6">
            Votre achat de <strong>{product?.title}</strong> a été confirmé.
          </p>
          <p className="text-sm text-gray-400">Redirection vers les produits...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Fil d'Ariane */}
      <nav className="text-sm text-gray-500 mb-6">
        <button onClick={() => navigate('/products')} className="hover:text-blue-600">Produits</button>
        <span className="mx-2">›</span>
        <button onClick={() => navigate(`/products/${productId}`)} className="hover:text-blue-600">{product?.title}</button>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">Paiement</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Résumé de la commande */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Récapitulatif</h2>
          
          {product?.image && (
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}

          <h3 className="text-lg font-semibold">{product?.title}</h3>
          <p className="text-gray-600 mt-2 line-clamp-2">{product?.description}</p>

          <div className="mt-6 space-y-3 border-t pt-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Prix</span>
              <span className="font-semibold text-lg">{product?.price?.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Frais de service</span>
              <span>Gratuit</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-xl text-blue-600">{product?.price?.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Formulaire de paiement */}
        <div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {productId && (
            <Elements stripe={stripePromise}>
              <CheckoutForm
                productId={productId}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  )
}