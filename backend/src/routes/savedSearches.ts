import { Router } from 'express'
import { prisma } from '../prisma'
import requireAuth, { AuthRequest } from '../middleware/auth'

const router = Router()

// Liste des recherches sauvegardées
router.get('/saved-searches', requireAuth, async (req: AuthRequest, res) => {
  try {
    const searches = await prisma.savedSearch.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: searches })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Sauvegarder une recherche
router.post('/saved-searches', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { query, categoryId, minPrice, maxPrice, condition, location, latitude, longitude, radius, notify } = req.body

    const search = await prisma.savedSearch.create({
      data: {
        userId: req.userId!,
        query: query || null,
        categoryId: categoryId || null,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        condition: condition || null,
        location: location || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        radius: radius ? parseFloat(radius) : null,
        notify: notify !== false,
      },
    })

    res.status(201).json({ data: search })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Supprimer une recherche
router.delete('/saved-searches/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const search = await prisma.savedSearch.findUnique({ where: { id: req.params.id } })
    if (!search) return res.status(404).json({ error: 'Recherche introuvable' })
    if (search.userId !== req.userId!) return res.status(403).json({ error: 'Non autorisé' })

    await prisma.savedSearch.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Activer/désactiver les notifications pour une recherche
router.patch('/saved-searches/:id/toggle', requireAuth, async (req: AuthRequest, res) => {
  try {
    const search = await prisma.savedSearch.findUnique({ where: { id: req.params.id } })
    if (!search) return res.status(404).json({ error: 'Recherche introuvable' })
    if (search.userId !== req.userId!) return res.status(403).json({ error: 'Non autorisé' })

    const updated = await prisma.savedSearch.update({
      where: { id: req.params.id },
      data: { notify: !search.notify },
    })

    res.json({ data: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router