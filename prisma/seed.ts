import { Role, DiscountType } from '@prisma/client'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Admin User ───────────────────────────────────────────────
  const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers()
  let authUser = existingAuthUsers.users.find((u) => u.email === 'admin@store.com')

  if (!authUser) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@store.com',
      password: 'Admin@1234',
      email_confirm: true,
      app_metadata: { role: 'ADMIN' },
      user_metadata: { name: 'Admin' },
    })
    if (error) throw error
    authUser = data.user
  } else {
    await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      app_metadata: { role: 'ADMIN' },
      user_metadata: { name: 'Admin' },
    })
  }

  const stalePrismaAdmin = await prisma.user.findUnique({ where: { email: 'admin@store.com' } })
  if (stalePrismaAdmin && stalePrismaAdmin.id !== authUser.id) {
    await prisma.user.delete({ where: { id: stalePrismaAdmin.id } })
  }

  const admin = await prisma.user.upsert({
    where: { id: authUser.id },
    update: { role: Role.ADMIN },
    create: {
      id: authUser.id,
      name: 'Admin',
      email: 'admin@store.com',
      role: Role.ADMIN,
    },
  })
  console.log('✅ Admin user:', admin.email)

  // ─── Clean old data ──────────────────────────────────────────────
  await prisma.product.deleteMany({})
  await prisma.category.deleteMany({})

  // ─── Categories ───────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: '2-piece-suits' },
      update: {},
      create: {
        name: '2-Piece Suits',
        slug: '2-piece-suits',
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4545?w=600&auto=format&fit=crop', // placeholder
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'blazers' },
      update: {},
      create: {
        name: 'Blazers',
        slug: 'blazers',
        image: 'https://images.unsplash.com/photo-1592878904946-b3ce8ae243c0?w=600&auto=format&fit=crop', // placeholder
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: '3-piece-suits' },
      update: {},
      create: {
        name: '3-Piece Suits',
        slug: '3-piece-suits',
        image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&auto=format&fit=crop', // placeholder
        sortOrder: 3,
      },
    }),
  ])
  console.log('✅ Categories:', categories.map(c => c.name).join(', '))

  // ─── Size Guides ──────────────────────────────────────────────
  const sizeGuideColumns = ["Size", "Chest", "Waist", "Shoulder", "Sleeve"]
  const sizeGuideRows = [
    ["S", "36-38", "30-32", "17", "24"],
    ["M", "38-40", "32-34", "17.5", "24.5"],
    ["L", "40-42", "34-36", "18", "25"],
    ["XL", "42-44", "36-38", "18.5", "25.5"],
    ["XXL", "44-46", "38-40", "19", "26"],
  ]
  for (const cat of categories) {
    await prisma.sizeGuide.upsert({
      where: { categoryId: cat.id },
      update: { columns: sizeGuideColumns, rows: sizeGuideRows },
      create: { 
        categoryId: cat.id, 
        unit: "inches", 
        columns: sizeGuideColumns, 
        rows: sizeGuideRows, 
        notes: "Measurements are in inches. Allow 0.5 inch tolerance." 
      }
    })
  }
  console.log('✅ Size Guides added')

  // ─── Products ─────────────────────────────────────────────────
  const productData = [
    {
      name: 'Classic Navy 2-Piece Suit',
      slug: 'classic-navy-2-piece-suit',
      price: 5999,
      comparePrice: 7500,
      categorySlug: '2-piece-suits',
      featured: true,
      description: 'A timeless classic 2-piece suit crafted from premium materials. Crisp, breathable, and versatile — perfect for modern formalwear.',
      images: [
        { url: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4545?w=800&auto=format&fit=crop', alt: 'Classic Navy 2-Piece Suit front' },
      ],
      colors: [
        { color: 'Navy', hex: '#1B2A4A' },
        { color: 'Black', hex: '#1a1a1a' },
        { color: 'Grey', hex: '#808080' },
        { color: 'Charcoal', hex: '#36454F' }
      ],
    },
    {
      name: 'Premium Wool Blazer',
      slug: 'premium-wool-blazer',
      price: 4499,
      comparePrice: 5500,
      categorySlug: 'blazers',
      featured: true,
      description: 'Modern slim fit blazer with a clean silhouette. Tailored for all-day comfort without compromising on style.',
      images: [
        { url: 'https://images.unsplash.com/photo-1592878904946-b3ce8ae243c0?w=800&auto=format&fit=crop', alt: 'Premium Wool Blazer' },
      ],
      colors: [
        { color: 'Navy', hex: '#1B2A4A' },
        { color: 'Black', hex: '#1a1a1a' },
        { color: 'Grey', hex: '#808080' },
        { color: 'Charcoal', hex: '#36454F' }
      ],
    },
    {
      name: 'Executive 3-Piece Suit',
      slug: 'executive-3-piece-suit',
      price: 6999,
      comparePrice: 8500,
      categorySlug: '3-piece-suits',
      featured: true,
      description: 'Effortlessly elegant 3-piece suit. Features a tailored vest, jacket, and trousers for the ultimate executive look.',
      images: [
        { url: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&auto=format&fit=crop', alt: 'Executive 3-Piece Suit' },
      ],
      colors: [
        { color: 'Navy', hex: '#1B2A4A' },
        { color: 'Black', hex: '#1a1a1a' },
        { color: 'Grey', hex: '#808080' },
        { color: 'Charcoal', hex: '#36454F' }
      ],
    },
  ]

  const sizes = ['S', 'M', 'L', 'XL', 'XXL']

  for (const pd of productData) {
    const category = categories.find(c => c.slug === pd.categorySlug)!
    const existing = await prisma.product.findUnique({ where: { slug: pd.slug } })
    if (existing) {
      const imgs = await prisma.productImage.findMany({ where: { product: { slug: pd.slug } } })
      if (imgs.length > 0 && imgs[0].url.includes('placehold.co')) {
        await prisma.productImage.deleteMany({ where: { product: { slug: pd.slug } } })
        await prisma.productImage.createMany({
          data: pd.images.map((img, i) => ({ ...img, productId: existing.id, sortOrder: i })),
        })
      }
      continue
    }

    const product = await prisma.product.create({
      data: {
        name: pd.name,
        slug: pd.slug,
        description: pd.description,
        price: pd.price,
        comparePrice: pd.comparePrice,
        categoryId: category.id,
        tags: 'formal, suit, tailored',
        isActive: true,
        isFeatured: pd.featured,
        images: {
          create: pd.images.map((img, i) => ({ ...img, sortOrder: i })),
        },
        variants: {
          create: sizes.flatMap(size =>
            pd.colors.map(c => ({
              size,
              color: c.color,
              colorHex: c.hex,
              sku: `${pd.slug}-${size}-${c.color}`.toUpperCase().replace(/\s+/g, '-'),
              stock: Math.floor(Math.random() * 20) + 5,
              price: null,
            }))
          ),
        },
      },
    })
    console.log('✅ Product:', product.name)
  }

  // ─── Settings ─────────────────────────────────────────────────
  const settings = [
    { key: 'store_name', value: 'Berber Clothing' },
    { key: 'currency', value: 'BDT' },
    { key: 'points_per_taka', value: '10' },
    { key: 'points_redemption_rate', value: '10' },
    { key: 'free_shipping_above', value: '5000' }, // Updated for Berber
    { key: 'shipping_charge', value: '80' },
  ]

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    })
  }
  console.log('✅ Settings saved')

  // ─── Pages ────────────────────────────────────────────────────
  const pages = [
    {
      slug: 'faq',
      title: 'FAQ & Shipping',
      content: '<h3>Shipping Policy</h3><p>We offer <strong>Free shipping on orders above ৳5,000</strong>. For orders below this amount, a flat delivery fee applies.</p>',
    },
    {
      slug: 'returns',
      title: 'Returns & Exchanges',
      content: '<h3>Exchange Policy</h3><p>We have an <strong>Exchange-only policy for sizing issues (no cash refunds)</strong>. The customer is responsible for covering the return shipping cost.</p>',
    },
  ]

  for (const p of pages) {
    await prisma.page.upsert({
      where: { slug: p.slug },
      update: { title: p.title, content: p.content },
      create: { ...p, isPublished: true },
    })
  }
  console.log('✅ Pages saved')

  console.log('\n🎉 Seed complete!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
