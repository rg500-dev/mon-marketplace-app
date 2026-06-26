const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const categories = [
  { name: 'Électronique', slug: 'electronique', icon: '📱' },
  { name: 'Véhicules', slug: 'vehicules', icon: '🚗' },
  { name: 'Immobilier', slug: 'immobilier', icon: '🏠' },
  { name: 'Mode', slug: 'mode', icon: '👕' },
  { name: 'Maison & Jardin', slug: 'maison-jardin', icon: '🏡' },
  { name: 'Sports & Loisirs', slug: 'sports-loisirs', icon: '⚽' },
  { name: 'Livres & Musique', slug: 'livres-musique', icon: '📚' },
  { name: 'Emploi & Services', slug: 'emploi-services', icon: '💼' },
  { name: 'Animaux', slug: 'animaux', icon: '🐾' },
  { name: 'Autres', slug: 'autres', icon: '📦' },
]

async function main() {
  console.log('🌱 Seeding categories...')
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
  }
  console.log('✅ Categories seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })