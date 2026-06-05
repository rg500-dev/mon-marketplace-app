import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../api'

export default function AdminPage() {
  const { user, loading } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [error, setError] = useState('')

  const loadAdminData = async () => {
    try {
      const [usersRes, productsRes, reportsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/products'),
        api.get('/admin/reports'),
      ])
      setUsers(usersRes.data.data)
      setProducts(productsRes.data.data)
      setReports(reportsRes.data.data)
      setError('')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erreur lors du chargement des données admin')
    }
  }

  useEffect(() => {
    if (!loading && user?.role === 'admin') {
      loadAdminData()
    }
  }, [loading, user])

  const updateUser = async (id: string, action: string) => {
    try {
      if (action === 'verify') await api.post(`/admin/users/${id}/verify`)
      if (action === 'suspend') await api.post(`/admin/users/${id}/suspend`)
      if (action === 'unsuspend') await api.post(`/admin/users/${id}/unsuspend`)
      if (action === 'make-admin') await api.post(`/admin/users/${id}/role`, { role: 'admin' })
      await loadAdminData()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erreur admin')
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      await api.delete(`/admin/products/${id}`)
      await loadAdminData()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erreur suppression produit')
    }
  }

  const handleReportAction = async (id: string, action: string) => {
    try {
      await api.post(`/admin/reports/${id}/action`, { action })
      await loadAdminData()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erreur de traitement du signalement')
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>
  if (!user) return <div className="p-6 text-red-600">Vous devez être connecté pour accéder à cette page.</div>
  if (user.role !== 'admin') return <div className="p-6 text-red-600">Accès admin requis.</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold text-slate-900">Panneau d'administration</h1>
      {error && <div className="mt-4 rounded-lg bg-red-100 p-4 text-red-700">{error}</div>}

      <section className="mt-8">
        <h2 className="text-2xl font-semibold text-slate-800">Gestion des utilisateurs</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Utilisateur</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Rôle</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Vérifié</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Suspendu</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((userItem) => (
                <tr key={userItem.id}>
                  <td className="px-4 py-3 text-sm text-slate-700">{userItem.username}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{userItem.email}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{userItem.role}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{userItem.verified ? 'Oui' : 'Non'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{userItem.isSuspended ? 'Oui' : 'Non'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 space-x-2">
                    {!userItem.verified && (
                      <button
                        onClick={() => updateUser(userItem.id, 'verify')}
                        className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
                      >
                        Vérifier
                      </button>
                    )}
                    {userItem.isSuspended ? (
                      <button
                        onClick={() => updateUser(userItem.id, 'unsuspend')}
                        className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                      >
                        Réactiver
                      </button>
                    ) : (
                      <button
                        onClick={() => updateUser(userItem.id, 'suspend')}
                        className="rounded bg-orange-600 px-3 py-1 text-white hover:bg-orange-700"
                      >
                        Suspendre
                      </button>
                    )}
                    {userItem.role !== 'admin' && (
                      <button
                        onClick={() => updateUser(userItem.id, 'make-admin')}
                        className="rounded bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-700"
                      >
                        Admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-slate-800">Rapports utilisateurs</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Titre</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Signalé par</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Produit / Utilisateur</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-4 py-3 text-sm text-slate-700">{report.title}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{report.type}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{report.status}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{report.reporter?.username}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {report.product ? report.product.title : report.reportedUser?.username || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 space-x-2">
                    {report.status !== 'closed' && (
                      <>
                        <button
                          onClick={() => handleReportAction(report.id, 'reviewed')}
                          className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
                        >
                          Traité
                        </button>
                        {report.product && (
                          <button
                            onClick={() => handleReportAction(report.id, 'removed')}
                            className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                          >
                            Retirer
                          </button>
                        )}
                        {report.reportedUser && (
                          <button
                            onClick={() => handleReportAction(report.id, 'suspended-user')}
                            className="rounded bg-orange-600 px-3 py-1 text-white hover:bg-orange-700"
                          >
                            Suspendre
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-slate-800">Gestion des produits</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Produit</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Vendeur</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Prix</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Publié</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3 text-sm text-slate-700">{product.title}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{product.seller?.username}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{product.price} €</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{new Date(product.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
