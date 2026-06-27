import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'

type Category = {
  id: string
  name: string
}

export default function CreateProductPage() {
  const { id: productId } = useParams()
  const isEditMode = Boolean(productId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [condition, setCondition] = useState('used')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(isEditMode)
  const [location, setLocation] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [locating, setLocating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/categories')
        setCategories(res.data.data)
      } catch (err) {
        console.error(err)
      }
    }
    loadCategories()
  }, [])

  // En mode édition, on charge l'annonce existante et on pré-remplit le formulaire
  useEffect(() => {
    if (!isEditMode || !productId) return
    const loadProduct = async () => {
      setLoadingProduct(true)
      setError('')
      try {
        const res = await api.get(`/products/${productId}`)
        const p = res.data.data
        setTitle(p.title || '')
        setDescription(p.description || '')
        setPrice(p.price?.toString() || '')
        setCategoryId(p.categoryId || '')
        setCondition(p.condition || 'used')
        setExistingImageUrl(p.image || null)
        setLocation(p.location || '')
        setLatitude(p.latitude?.toString() || '')
        setLongitude(p.longitude?.toString() || '')
      } catch (err: any) {
        console.error(err)
        setError(err?.response?.data?.error || "Impossible de charger l'annonce.")
      } finally {
        setLoadingProduct(false)
      }
    }
    loadProduct()
  }, [isEditMode, productId])

  const uploadImage = async () => {
    if (!imageFile) return null
    const formData = new FormData()
    formData.append('image', imageFile)
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data.url
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!title || !description || !price || !categoryId) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }

    setLoading(true)
    try {
      // On n'uploade une nouvelle image que si l'utilisateur en a sélectionné une nouvelle.
      // Sinon, en édition, on conserve l'image existante.
      let imageUrl = existingImageUrl
      if (imageFile) {
        try {
          imageUrl = await uploadImage()
        } catch (uploadErr) {
          console.warn('Upload échoué, annonce sans nouvelle image:', uploadErr)
        }
      }

      const payload = {
        title,
        description,
        price,
        categoryId,
        condition,
        imageUrl,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        location: location || undefined,
      }

      if (isEditMode) {
        await api.put(`/products/${productId}`, payload)
        navigate(`/products/${productId}`)
      } else {
        const res = await api.post('/products', payload)
        navigate(`/products/${res.data.data.id}`)
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.error || (isEditMode ? "Impossible de modifier l'annonce." : "Impossible de créer l'annonce."))
    } finally {
      setLoading(false)
    }
  }

  if (loadingProduct) {
    return <div className="max-w-3xl mx-auto px-4 py-12">Chargement de l'annonce...</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">{isEditMode ? "Modifier l'annonce" : 'Publier une annonce'}</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        <div>
          <label className="block text-sm font-medium mb-2">Titre</label>
          <input
            className="w-full border rounded p-3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du produit"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            className="w-full border rounded p-3"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez le produit en détail"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Prix (€)</label>
            <input
              type="number"
              className="w-full border rounded p-3"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Prix"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Catégorie</label>
            <select
              className="w-full border rounded p-3"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Sélectionnez une catégorie</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">État</label>
            <select
              className="w-full border rounded p-3"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              <option value="used">Occasion</option>
              <option value="good">Bon état</option>
              <option value="like-new">Comme neuf</option>
              <option value="new">Neuf</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Image</label>
            {existingImageUrl && !imageFile && (
              <div className="mb-2 flex items-center gap-2">
                <img src={existingImageUrl} alt="Image actuelle" className="h-16 w-16 object-contain border rounded bg-gray-50" />
                <span className="text-xs text-gray-500">Image actuelle (laissez vide pour la conserver)</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          </div>
        </div>
        {/* Localisation */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-3">📍 Localisation</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ville / Adresse</label>
              <input
                className="w-full border rounded p-3"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Paris 11e, Dakar..."
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  if (!navigator.geolocation) {
                    setError('La géolocalisation n\'est pas supportée par votre navigateur')
                    return
                  }
                  setLocating(true)
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      setLatitude(pos.coords.latitude.toString())
                      setLongitude(pos.coords.longitude.toString())
                      setLocation(`Position actuelle (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`)
                      setLocating(false)
                    },
                    () => {
                      setError('Impossible de récupérer votre position. Entrez l\'adresse manuellement.')
                      setLocating(false)
                    }
                  )
                }}
                disabled={locating}
                className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 w-full"
              >
                {locating ? '🔄 Détection...' : '📍 Utiliser ma position'}
              </button>
            </div>
          </div>
          {latitude && longitude && (
            <p className="text-sm text-green-600 mt-2">
              ✓ Position définie : {latitude}, {longitude}
            </p>
          )}
        </div>

        {error && <div className="text-red-600">{error}</div>}
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
          {loading ? 'Enregistrement...' : isEditMode ? "Enregistrer les modifications" : 'Publier l’annonce'}
        </button>
      </form>
    </div>
  )
}
