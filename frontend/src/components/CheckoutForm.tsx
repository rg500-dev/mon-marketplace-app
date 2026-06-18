import { useState } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import api from '../api'

interface CheckoutFormProps {
  productId: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function CheckoutForm({ productId, onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  // 1. Charger l'intention de paiement depuis le backend
  const createPaymentIntent = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/payment/create-intent', { productId })
      setClientSecret(res.data.clientSecret)

      // Sauvegarder la clé publiable pour Stripe (elle est aussi renvoyée par le backend)
      if (res.data.publishableKey) {
        localStorage.setItem('stripe_pk', res.data.publishableKey)
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Erreur lors de la création du paiement'
      setError(message)
      onError?.(message)
    } finally {
      setLoading(false)
    }
  }

  // 2. Soumettre le paiement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      setError('Stripe n\'est pas encore initialisé')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'Erreur de validation')
        return
      }

      const { error: paymentError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?productId=${productId}`,
        },
        redirect: 'if_required',
      })

      if (paymentError) {
        setError(paymentError.message || 'Paiement échoué')
        onError?.(paymentError.message || 'Paiement échoué')
      } else {
        // Paiement réussi (sans redirection)
        onSuccess?.()
      }
    } catch (err: any) {
      setError(err.message || 'Erreur inattendue')
      onError?.(err.message || 'Erreur inattendue')
    } finally {
      setLoading(false)
    }
  }

  // Si pas encore de clientSecret, afficher le bouton pour initier
  if (!clientSecret) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Paiement sécurisé</h2>
        <p className="text-gray-600 mb-6">
          Vous allez être redirigé vers Stripe pour effectuer le paiement de manière sécurisée.
        </p>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        <button
          onClick={createPaymentIntent}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Préparation du paiement...' : '💰 Payer avec Stripe'}
        </button>
        <p className="text-xs text-gray-400 mt-4 text-center">
          Paiement 100% sécurisé • Vos informations bancaires sont chiffrées par Stripe
        </p>
      </div>
    )
  }

  // Formulaire Stripe avec PaymentElement
  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Finaliser le paiement</h2>

      <PaymentElement />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6 font-medium"
      >
        {loading ? 'Paiement en cours...' : '✅ Confirmer le paiement'}
      </button>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Paiement 100% sécurisé via Stripe
      </p>
    </form>
  )
}