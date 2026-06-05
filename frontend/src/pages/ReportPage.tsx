import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'

export default function ReportPage() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [type, setType] = useState<'product' | 'user'>('product')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [productId, setProductId] = useState<string | undefined>()
  const [reportedUserId, setReportedUserId] = useState<string | undefined>()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const product = params.get('productId')
    const reportedUser = params.get('reportedUserId')
    if (product) {
      setType('product')
      setProductId(product)
      setTitle('Signalement de produit')
    }
    if (reportedUser) {
      setType('user')
      setReportedUserId(reportedUser)
      setTitle('Signalement d’utilisateur')
    }
  }, [location.search])

  const handleSubmit = async () => {
    if (!user) return
    setError('')
    setSuccess('')
    if (!title || !description) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    if (type === 'product' && !productId) {
      setError('Aucun produit sélectionné pour le signalement.')
      return
    }
    if (type === 'user' && !reportedUserId) {
      setError('Aucun utilisateur sélectionné pour le signalement.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/reports', {
        type,
        title,
        description,
        productId: productId || undefined,
        reportedUserId: reportedUserId || undefined,
      })
      setSuccess('Votre signalement a bien été envoyé. Merci.')
      setError('')
      setTitle(type === 'product' ? 'Signalement de produit' : 'Signalement d’utilisateur')
      setDescription('')
      setTimeout(() => navigate('/'), 1200)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible d’envoyer le signalement.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-12">Chargement...</div>
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <p className="text-red-600 mb-4">Vous devez être connecté pour signaler un contenu.</p>
        <Link to="/login" className="text-blue-600 hover:underline">
          Connectez-vous
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Signaler un contenu</h1>
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Type de signalement</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'product' | 'user')}
            className="mt-2 block w-full rounded border p-3"
          >
            <option value="product">Produit</option>
            <option value="user">Utilisateur</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Titre</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 block w-full rounded border p-3"
            placeholder="Titre du signalement"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="mt-2 block w-full rounded border p-3"
            placeholder="Expliquez pourquoi ce contenu doit être modéré"
          />
        </div>

        {productId && <p className="text-sm text-gray-600">Produit signalé : {productId}</p>}
        {reportedUserId && <p className="text-sm text-gray-600">Utilisateur signalé : {reportedUserId}</p>}

        {error && <div className="rounded bg-red-100 p-3 text-red-700">{error}</div>}
        {success && <div className="rounded bg-green-100 p-3 text-green-700">{success}</div>}

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {submitting ? 'Envoi...' : 'Envoyer le signalement'}
          </button>
          <Link to="/" className="rounded border border-slate-300 px-4 py-3 text-slate-700 hover:bg-slate-100">
            Annuler
          </Link>
        </div>
      </div>
    </div>
  )
}
