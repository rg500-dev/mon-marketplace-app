import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create categories
  const electronics = await prisma.category.create({
    data: {
      name: 'Électronique',
      slug: 'electronique',
      icon: '📱',
    },
  })

  const clothing = await prisma.category.create({
    data: {
      name: 'Vêtements',
      slug: 'vetements',
      icon: '👕',
    },
  })

  const furniture = await prisma.category.create({
    data: {
      name: 'Meubles',
      slug: 'meubles',
      icon: '🛋️',
    },
  })

  // Create test user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashed_password', // Use bcrypt in real app
      firstName: 'Test',
      lastName: 'User',
      location: 'Paris',
    },
  })

  // Create sample products
  await prisma.product.create({
    data: {
      title: 'iPhone 13',
      description: 'iPhone 13 en excellent état',
      price: 599.99,
      condition: 'good',
      status: 'active',
      categoryId: electronics.id,
      sellerId: user.id,
    },
  })

  console.log('✅ Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
