import 'dotenv/config'
import bcrypt from 'bcrypt'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  ROLE_DESCRIPTIONS,
} from '../src/lib/permissions.js'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

const SUPER_ADMIN_ROLE = 'SUPER_ADMIN'
const email = (process.env.SEED_SUPER_ADMIN_EMAIL ?? 'superadmin@ilokal.my').trim().toLowerCase()
const password = process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'SuperAdmin123!'
const name = process.env.SEED_SUPER_ADMIN_NAME ?? 'David R.'
const operationsEmail = (
  process.env.SEED_OPERATIONS_EMAIL ?? 'meiling@ilokal.my'
).trim().toLowerCase()
const operationsPassword = process.env.SEED_OPERATIONS_PASSWORD ?? 'Operations123!'
const adminDemoEmail = (process.env.SEED_ADMIN_EMAIL ?? 'faiz@ilokal.my').trim().toLowerCase()
const adminDemoPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!'

const adapter = new PrismaPg({ connectionString: databaseUrl })
const prisma = new PrismaClient({ adapter })

const sampleMerchants = [
  {
    merchantCode: 'MRC-0148',
    businessName: 'Kedai Kopi Seri Wangi',
    legalName: 'Seri Wangi Enterprise (002338-K)',
    category: 'Food & Beverage',
    subCategories: ['Kopitiam', 'Halal', 'Breakfast'],
    description:
      'Third-generation kopitiam serving white coffee, kaya toast and local breakfast.',
    registrationNo: 'SSM202301004521',
    priceRange: 'RM RM',
    phone: '012-338 9021',
    email: 'seriwangi@gmail.com',
    whatsapp: '012-338 9021',
    website: '',
    city: 'Kuala Lumpur',
    state: 'WP',
    address: 'Kampung Baru, Kuala Lumpur',
    postcode: '50300',
    latitude: '3.1612',
    longitude: '101.7068',
    outletType: 'single' as const,
    picName: 'Encik Rosli bin Ahmad',
    hoursWeekday: '7:00 – 18:00',
    hoursWeekend: '7:00 – 15:00',
    hoursPublicHoliday: 'Closed',
    featured: true,
    status: 'active' as const,
    offersCount: 4,
    redeemedCount: 1284,
    rating: 4.6,
    ratingsCount: 208,
    profileViews: 3904,
    redeemed30d: 312,
    uniqueMembers: 241,
    membersReached: 892,
    slug: 'kedai-kopi-seri-wangi',
    createdBy: 'Aisyah R.',
    offers: [
      {
        id: 'o1',
        title: '15% off total bill',
        details: 'Members only · no minimum spend · daily',
        endsAt: '31 Dec 2026',
        status: 'live',
      },
    ],
    activities: [
      {
        id: 'a1',
        dateLabel: '11 AUG',
        description: 'Offer 15% off total bill extended to 31 Dec',
        actor: 'Aisyah R.',
      },
    ],
  },
  {
    merchantCode: 'MRC-0203',
    businessName: 'Batik Warisan Gallery',
    legalName: 'Warisan Batik Sdn Bhd',
    category: 'Retail & Crafts',
    subCategories: ['Batik', 'Handicraft'],
    description: 'Heritage batik gallery featuring local artisans and workshops.',
    registrationNo: 'SSM202201118822',
    priceRange: 'RM RM RM',
    phone: '04-261 7788',
    email: 'hello@batikwarisan.my',
    whatsapp: '04-261 7788',
    website: 'https://batikwarisan.my',
    city: 'George Town',
    state: 'Penang',
    address: 'Armenian Street, George Town, Penang',
    postcode: '10200',
    latitude: '5.4141',
    longitude: '100.3288',
    outletType: 'single' as const,
    picName: 'Siti Aminah',
    hoursWeekday: '10:00 – 19:00',
    hoursWeekend: '10:00 – 18:00',
    hoursPublicHoliday: 'Closed',
    featured: false,
    status: 'active' as const,
    offersCount: 2,
    redeemedCount: 619,
    rating: 4.4,
    ratingsCount: 96,
    profileViews: 2104,
    redeemed30d: 88,
    uniqueMembers: 71,
    membersReached: 340,
    slug: 'batik-warisan-gallery',
    createdBy: 'Faiz M.',
    offers: [
      {
        id: 'o4',
        title: '10% off batik scarves',
        details: 'Members only · weekends',
        endsAt: '31 Oct 2026',
        status: 'live',
      },
    ],
    activities: [
      {
        id: 'b1',
        dateLabel: '01 AUG',
        description: 'Offer refreshed for festive season',
        actor: 'Faiz M.',
      },
    ],
  },
  {
    merchantCode: 'MRC-0217',
    businessName: 'Ipoh White Coffee Co.',
    legalName: 'Ipoh White Coffee Co.',
    category: 'Food & Beverage',
    subCategories: ['Coffee', 'Cafe'],
    description: 'Specialty white coffee brand rooted in Ipoh heritage roasting.',
    registrationNo: 'SSM202401009911',
    priceRange: 'RM RM',
    phone: '05-255 4102',
    email: 'hello@ipohwhitecoffee.my',
    whatsapp: '05-255 4102',
    website: '',
    city: 'Ipoh',
    state: 'Perak',
    address: 'Jalan Sultan Iskandar, Ipoh, Perak',
    postcode: '30000',
    latitude: '4.5975',
    longitude: '101.0901',
    outletType: 'multi' as const,
    picName: 'Tan Wei Ming',
    hoursWeekday: '8:00 – 20:00',
    hoursWeekend: '8:00 – 21:00',
    hoursPublicHoliday: 'Open',
    featured: false,
    status: 'pending' as const,
    offersCount: 3,
    redeemedCount: 842,
    rating: 4.2,
    ratingsCount: 54,
    profileViews: 980,
    redeemed30d: 42,
    uniqueMembers: 39,
    membersReached: 120,
    slug: 'ipoh-white-coffee-co',
    createdBy: 'Aisyah R.',
    offers: [],
    activities: [
      {
        id: 'c1',
        dateLabel: '10 AUG',
        description: 'Submitted for approval',
        actor: 'Aisyah R.',
      },
    ],
  },
  {
    merchantCode: 'MRC-0091',
    businessName: 'Melaka Nyonya Kitchen',
    legalName: 'Nyonya Kitchen Melaka',
    category: 'Food & Beverage',
    subCategories: ['Nyonya', 'Heritage'],
    description: 'Home-style Nyonya cuisine in the heart of Melaka.',
    registrationNo: 'SSM201901003311',
    priceRange: 'RM RM',
    phone: '06-282 3311',
    email: 'hello@nyonyakitchen.my',
    whatsapp: '06-282 3311',
    website: '',
    city: 'Melaka',
    state: 'Melaka',
    address: 'Jalan Hang Jebat, Melaka',
    postcode: '75000',
    latitude: '2.1944',
    longitude: '102.2491',
    outletType: 'single' as const,
    picName: 'Lim Siew Lan',
    hoursWeekday: '11:00 – 21:00',
    hoursWeekend: '11:00 – 22:00',
    hoursPublicHoliday: 'Open',
    featured: false,
    status: 'active' as const,
    offersCount: 1,
    redeemedCount: 210,
    rating: 4.1,
    ratingsCount: 38,
    profileViews: 640,
    redeemed30d: 18,
    uniqueMembers: 14,
    membersReached: 88,
    slug: 'melaka-nyonya-kitchen',
    createdBy: 'Faiz M.',
    offers: [
      {
        id: 'o5',
        title: 'Free dessert with set lunch',
        details: 'Weekdays only',
        endsAt: '31 Dec 2026',
        status: 'live',
      },
    ],
    activities: [],
  },
  {
    merchantCode: 'MRC-0176',
    businessName: 'JB Sports Hub',
    legalName: 'JB Sports Hub Sdn Bhd',
    category: 'Fitness',
    subCategories: ['Gym', 'Sports'],
    description: 'Community sports and fitness centre in Johor Bahru.',
    registrationNo: 'SSM202001007711',
    priceRange: 'RM RM',
    phone: '07-221 8899',
    email: 'hello@jbsportshub.my',
    whatsapp: '07-221 8899',
    website: 'https://jbsportshub.my',
    city: 'Johor Bahru',
    state: 'Johor',
    address: 'Taman Molek, Johor Bahru, Johor',
    postcode: '81100',
    latitude: '1.5350',
    longitude: '103.7880',
    outletType: 'single' as const,
    picName: 'Arif Hakim',
    hoursWeekday: '6:00 – 22:00',
    hoursWeekend: '7:00 – 21:00',
    hoursPublicHoliday: 'Open',
    featured: false,
    status: 'inactive' as const,
    offersCount: 2,
    redeemedCount: 455,
    rating: 4.0,
    ratingsCount: 62,
    profileViews: 1120,
    redeemed30d: 0,
    uniqueMembers: 55,
    membersReached: 210,
    slug: 'jb-sports-hub',
    createdBy: 'Aisyah R.',
    offers: [],
    activities: [
      {
        id: 'd1',
        dateLabel: '05 AUG',
        description: 'Temporarily deactivated pending renewal',
        actor: 'Aisyah R.',
      },
    ],
  },
]

async function main() {
  const role = await prisma.role.upsert({
    where: { name: SUPER_ADMIN_ROLE },
    update: { description: ROLE_DESCRIPTIONS.SUPER_ADMIN },
    create: { name: SUPER_ADMIN_ROLE, description: ROLE_DESCRIPTIONS.SUPER_ADMIN },
  })

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      roleId: role.id,
      isActive: true,
      status: 'active',
      deletedAt: null,
    },
    create: {
      name,
      email,
      passwordHash,
      roleId: role.id,
      isActive: true,
      status: 'active',
      lastLoginAt: new Date(),
    },
  })

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: { description: ROLE_DESCRIPTIONS.ADMIN },
    create: { name: 'ADMIN', description: ROLE_DESCRIPTIONS.ADMIN },
  })
  const operationsRole = await prisma.role.upsert({
    where: { name: 'OPERATIONS' },
    update: { description: ROLE_DESCRIPTIONS.OPERATIONS },
    create: { name: 'OPERATIONS', description: ROLE_DESCRIPTIONS.OPERATIONS },
  })

  // Catalog + role permission defaults
  for (const module of PERMISSION_MODULES) {
    for (const action of PERMISSION_ACTIONS) {
      await prisma.permission.upsert({
        where: { module_action: { module, action } },
        update: { description: `${action} access for ${module}` },
        create: {
          module,
          action,
          description: `${action} access for ${module}`,
        },
      })
    }
  }

  for (const [roleCode, matrix] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const roleRow = await prisma.role.findUnique({ where: { name: roleCode } })
    if (!roleRow) continue
    const existing = await prisma.rolePermission.count({ where: { roleId: roleRow.id } })
    if (existing === 0) {
      for (const module of PERMISSION_MODULES) {
        for (const action of matrix[module] ?? []) {
          const permission = await prisma.permission.findUnique({
            where: { module_action: { module, action } },
          })
          if (!permission) continue
          await prisma.rolePermission.create({
            data: { roleId: roleRow.id, permissionId: permission.id },
          })
        }
      }
    }
  }

  const invitePlaceholderHash = await bcrypt.hash('InvitePending-NotForLogin!', 12)
  const operationsHash = await bcrypt.hash(operationsPassword, 12)
  const adminDemoHash = await bcrypt.hash(adminDemoPassword, 12)
  const sampleAdminUsers = [
    {
      name: 'Faiz Mohammed',
      email: adminDemoEmail,
      roleId: adminRole.id,
      status: 'active' as const,
      isActive: true,
      lastLoginAt: new Date(),
      invitedAt: null as Date | null,
      passwordHash: adminDemoHash,
    },
    {
      name: 'Nurul Huda',
      email: 'nurul@ilokal.my',
      roleId: operationsRole.id,
      status: 'active' as const,
      isActive: true,
      lastLoginAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      invitedAt: null as Date | null,
      passwordHash: invitePlaceholderHash,
    },
    {
      name: 'Daniel Lim',
      email: 'daniel@ilokal.my',
      roleId: adminRole.id,
      status: 'pending' as const,
      isActive: false,
      lastLoginAt: null as Date | null,
      invitedAt: new Date('2026-08-10T00:00:00.000Z'),
      passwordHash: invitePlaceholderHash,
    },
    {
      name: 'Siti Aminah',
      email: 'siti@ilokal.my',
      roleId: operationsRole.id,
      status: 'active' as const,
      isActive: true,
      lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      invitedAt: null as Date | null,
      passwordHash: invitePlaceholderHash,
    },
    {
      name: 'Jason Tan',
      email: 'jason@ilokal.my',
      roleId: adminRole.id,
      status: 'inactive' as const,
      isActive: false,
      lastLoginAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      invitedAt: null as Date | null,
      passwordHash: invitePlaceholderHash,
    },
    {
      name: 'Mei Ling Chong',
      email: operationsEmail,
      roleId: operationsRole.id,
      status: 'active' as const,
      isActive: true,
      lastLoginAt: new Date(),
      invitedAt: null as Date | null,
      passwordHash: operationsHash,
    },
  ]

  for (const admin of sampleAdminUsers) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {
        name: admin.name,
        roleId: admin.roleId,
        status: admin.status,
        isActive: admin.isActive,
        lastLoginAt: admin.lastLoginAt,
        invitedAt: admin.invitedAt,
        deletedAt: null,
        passwordHash: admin.passwordHash,
      },
      create: {
        name: admin.name,
        email: admin.email,
        passwordHash: admin.passwordHash,
        roleId: admin.roleId,
        status: admin.status,
        isActive: admin.isActive,
        lastLoginAt: admin.lastLoginAt,
        invitedAt: admin.invitedAt,
      },
    })
  }

  for (const merchant of sampleMerchants) {
    await prisma.merchant.upsert({
      where: { merchantCode: merchant.merchantCode },
      update: {
        businessName: merchant.businessName,
        legalName: merchant.legalName,
        category: merchant.category,
        subCategories: merchant.subCategories,
        description: merchant.description,
        registrationNo: merchant.registrationNo,
        priceRange: merchant.priceRange,
        phone: merchant.phone,
        email: merchant.email,
        whatsapp: merchant.whatsapp,
        website: merchant.website,
        city: merchant.city,
        state: merchant.state,
        address: merchant.address,
        postcode: merchant.postcode,
        latitude: merchant.latitude,
        longitude: merchant.longitude,
        outletType: merchant.outletType,
        picName: merchant.picName,
        hoursWeekday: merchant.hoursWeekday,
        hoursWeekend: merchant.hoursWeekend,
        hoursPublicHoliday: merchant.hoursPublicHoliday,
        featured: merchant.featured,
        status: merchant.status,
        offersCount: merchant.offersCount,
        redeemedCount: merchant.redeemedCount,
        rating: merchant.rating,
        ratingsCount: merchant.ratingsCount,
        profileViews: merchant.profileViews,
        redeemed30d: merchant.redeemed30d,
        uniqueMembers: merchant.uniqueMembers,
        membersReached: merchant.membersReached,
        slug: merchant.slug,
        createdBy: merchant.createdBy,
        offers: merchant.offers,
        activities: merchant.activities,
        deletedAt: null,
      },
      create: {
        ...merchant,
        logoUrl: null,
        coverUrl: null,
        galleryUrls: [],
      },
    })
  }

  const merchantByCode = Object.fromEntries(
    (
      await prisma.merchant.findMany({
        where: { merchantCode: { in: sampleMerchants.map((m) => m.merchantCode) } },
        select: { id: true, merchantCode: true, businessName: true, category: true },
      })
    ).map((m) => [m.merchantCode, m]),
  )

  const sampleOffers = [
    {
      offerCode: 'OFR-0108',
      merchantCode: 'MRC-0148',
      title: '20% off total bill',
      description: 'Members receive 20% off their total dine-in bill at Kedai Kopi Seri Wangi.',
      termsAndConditions: 'Valid for dine-in only. Not stackable with other promotions.',
      offerType: 'percentage' as const,
      benefitLabel: '20% discount',
      benefitValue: '20%',
      eligibility: 'iLokal members only',
      validFrom: new Date('2026-01-01T00:00:00.000Z'),
      validTo: new Date('2026-12-31T00:00:00.000Z'),
      validityLabel: '01 Jan 2026 – 31 Dec 2026',
      redemptionInstructions: 'Show membership QR at the counter before payment.',
      redemptionLimit: '1 per member per day',
      maxRedemptions: 5000,
      maxRedemptionsPerMember: 1,
      redeemedCount: 312,
      status: 'live' as const,
    },
    {
      offerCode: 'OFR-0109',
      merchantCode: 'MRC-0148',
      title: 'Buy one get one free kaya toast',
      description: 'Purchase any coffee and receive a complimentary kaya toast.',
      termsAndConditions: 'One BOGO redemption per member per visit. Breakfast hours only.',
      offerType: 'bogo' as const,
      benefitLabel: 'Buy one get one free',
      benefitValue: 'BOGO kaya toast',
      eligibility: 'iLokal members only',
      validFrom: new Date('2026-03-01T00:00:00.000Z'),
      validTo: new Date('2026-09-30T00:00:00.000Z'),
      validityLabel: '01 Mar 2026 – 30 Sep 2026',
      redemptionInstructions: 'Mention the offer when ordering between 8am–11am.',
      redemptionLimit: '1 per member per day',
      maxRedemptions: 2000,
      maxRedemptionsPerMember: 1,
      redeemedCount: 148,
      status: 'live' as const,
    },
    {
      offerCode: 'OFR-0203',
      merchantCode: 'MRC-0203',
      title: 'RM15 off batik scarf',
      description: 'Fixed RM15 discount on selected batik scarves.',
      termsAndConditions: 'Selected SKUs only. While stocks last.',
      offerType: 'fixed' as const,
      benefitLabel: 'RM15 off',
      benefitValue: 'RM15',
      eligibility: 'iLokal members only',
      validFrom: new Date('2026-06-01T00:00:00.000Z'),
      validTo: new Date('2026-10-31T00:00:00.000Z'),
      validityLabel: '01 Jun 2026 – 31 Oct 2026',
      redemptionInstructions: 'Present membership at checkout.',
      redemptionLimit: '2 per member',
      maxRedemptions: 800,
      maxRedemptionsPerMember: 2,
      redeemedCount: 96,
      status: 'live' as const,
    },
    {
      offerCode: 'OFR-0217',
      merchantCode: 'MRC-0217',
      title: 'Member pricing on white coffee set',
      description: 'Special member price for the classic Ipoh white coffee set.',
      termsAndConditions: 'Dine-in only. Excludes delivery.',
      offerType: 'member_pricing' as const,
      benefitLabel: 'Member set RM12',
      benefitValue: 'RM12 set',
      eligibility: 'Active iLokal members',
      validFrom: new Date('2026-08-15T00:00:00.000Z'),
      validTo: new Date('2026-11-15T00:00:00.000Z'),
      validityLabel: '15 Aug 2026 – 15 Nov 2026',
      redemptionInstructions: 'Scan membership QR before ordering.',
      redemptionLimit: 'Unlimited during promo period',
      maxRedemptions: null,
      maxRedemptionsPerMember: null,
      redeemedCount: 0,
      status: 'scheduled' as const,
    },
    {
      offerCode: 'OFR-0091',
      merchantCode: 'MRC-0091',
      title: 'Free dessert with set lunch',
      description: 'Complimentary Nyonya dessert with any weekday set lunch.',
      termsAndConditions: 'Weekdays only. One dessert per set lunch.',
      offerType: 'free_gift' as const,
      benefitLabel: 'Free dessert',
      benefitValue: 'Free dessert',
      eligibility: 'iLokal members only',
      validFrom: new Date('2026-01-01T00:00:00.000Z'),
      validTo: new Date('2026-12-31T00:00:00.000Z'),
      validityLabel: '01 Jan 2026 – 31 Dec 2026',
      redemptionInstructions: 'Ask for the member dessert when ordering set lunch.',
      redemptionLimit: '1 per member per day',
      maxRedemptions: 1500,
      maxRedemptionsPerMember: 1,
      redeemedCount: 210,
      status: 'live' as const,
    },
    {
      offerCode: 'OFR-0176',
      merchantCode: 'MRC-0176',
      title: 'Gym day-pass voucher',
      description: 'Redeem a single-day gym access voucher at JB Sports Hub.',
      termsAndConditions: 'Subject to facility capacity. Advance booking preferred.',
      offerType: 'voucher' as const,
      benefitLabel: 'Day-pass voucher',
      benefitValue: '1 day pass',
      eligibility: 'iLokal members only',
      validFrom: new Date('2025-01-01T00:00:00.000Z'),
      validTo: new Date('2025-12-31T00:00:00.000Z'),
      validityLabel: '01 Jan 2025 – 31 Dec 2025',
      redemptionInstructions: 'Show voucher code at reception.',
      redemptionLimit: '1 per member',
      maxRedemptions: 300,
      maxRedemptionsPerMember: 1,
      redeemedCount: 288,
      status: 'expired' as const,
    },
  ]

  for (const offer of sampleOffers) {
    const merchant = merchantByCode[offer.merchantCode]
    if (!merchant) continue
    const { merchantCode: _code, ...data } = offer
    await prisma.offer.upsert({
      where: { offerCode: offer.offerCode },
      update: {
        ...data,
        merchantId: merchant.id,
        imageUrl: null,
        deletedAt: null,
      },
      create: {
        ...data,
        merchantId: merchant.id,
        imageUrl: null,
      },
    })
  }

  for (const merchant of Object.values(merchantByCode)) {
    const count = await prisma.offer.count({
      where: {
        merchantId: merchant.id,
        deletedAt: null,
        status: { in: ['live', 'scheduled'] },
      },
    })
    await prisma.merchant.update({
      where: { id: merchant.id },
      data: { offersCount: count },
    })
  }

  const sampleMembers = [
    {
      memberCode: 'IL-2026-004821',
      fullName: 'Nurul Aisyah',
      email: 'nurul.aisyah@gmail.com',
      phone: '012-334 9821',
      city: 'Petaling Jaya',
      status: 'active' as const,
      plan: 'Annual' as const,
      joinedAt: new Date('2026-08-12T08:00:00.000Z'),
      expiresAt: new Date('2027-08-12T08:00:00.000Z'),
      totalPurchases: 2,
      totalRedemptions: 14,
      reviewsCount: 3,
      deviceName: 'iPhone 15',
      lastActiveAt: new Date('2026-08-11T18:00:00.000Z'),
      appVersion: '2.4.1',
      platform: 'iOS',
      paymentStatus: 'Paid',
      purchases: [
        {
          id: 'p1',
          date: '2026-08-12T08:00:00.000Z',
          description: 'Annual Membership',
          plan: 'Annual Plan',
          amountLabel: 'RM 199',
          status: 'Paid',
        },
        {
          id: 'p2',
          date: '2025-08-12T08:00:00.000Z',
          description: 'Annual Membership renewal',
          plan: 'Annual Plan',
          amountLabel: 'RM 199',
          status: 'Paid',
        },
      ],
      redemptions: [
        {
          id: 'r1',
          date: '2026-08-11T10:00:00.000Z',
          merchantName: 'Kedai Kopi Seri Wangi',
          offerTitle: '15% off total bill',
          status: 'Redeemed',
        },
        {
          id: 'r2',
          date: '2026-08-07T15:00:00.000Z',
          merchantName: 'Batik Warisan Gallery',
          offerTitle: '10% off selected items',
          status: 'Redeemed',
        },
      ],
      reviews: [
        {
          id: 'rv1',
          merchantName: 'Kedai Kopi Seri Wangi',
          rating: 5,
          text: 'Great coffee and very friendly service.',
          date: '2026-08-11T12:00:00.000Z',
        },
      ],
      supportNotes: [
        {
          id: 'n1',
          date: '2026-08-08T09:00:00.000Z',
          note: 'Member contacted support regarding membership renewal.',
          addedBy: 'Aisyah R.',
        },
      ],
    },
    {
      memberCode: 'IL-2026-004822',
      fullName: 'Aqmal Faris',
      email: 'aqmal.faris@gmail.com',
      phone: '013-456 7210',
      city: 'Kuala Lumpur',
      status: 'active' as const,
      plan: 'Monthly' as const,
      joinedAt: new Date('2026-08-09T08:00:00.000Z'),
      expiresAt: new Date('2026-09-09T08:00:00.000Z'),
      totalPurchases: 1,
      totalRedemptions: 5,
      reviewsCount: 1,
      deviceName: 'Samsung Galaxy S24',
      lastActiveAt: new Date('2026-08-10T20:00:00.000Z'),
      appVersion: '2.4.1',
      platform: 'Android',
      paymentStatus: 'Paid',
      purchases: [
        {
          id: 'p1',
          date: '2026-08-09T08:00:00.000Z',
          description: 'Monthly Membership',
          plan: 'Monthly Plan',
          amountLabel: 'RM 19',
          status: 'Paid',
        },
      ],
      redemptions: [
        {
          id: 'r1',
          date: '2026-08-10T11:00:00.000Z',
          merchantName: 'Ipoh White Coffee Co.',
          offerTitle: 'Free upsize',
          status: 'Redeemed',
        },
      ],
      reviews: [
        {
          id: 'rv1',
          merchantName: 'Ipoh White Coffee Co.',
          rating: 4,
          text: 'Nice ambience, fast service.',
          date: '2026-08-10T12:30:00.000Z',
        },
      ],
      supportNotes: [],
    },
    {
      memberCode: 'IL-2026-004823',
      fullName: 'Omar Faisal',
      email: 'omar.faisal@gmail.com',
      phone: '011-289 4421',
      city: 'Shah Alam',
      status: 'active' as const,
      plan: 'Annual' as const,
      joinedAt: new Date('2026-08-04T08:00:00.000Z'),
      expiresAt: new Date('2027-08-04T08:00:00.000Z'),
      totalPurchases: 1,
      totalRedemptions: 8,
      reviewsCount: 2,
      deviceName: 'iPhone 14',
      lastActiveAt: new Date('2026-08-12T09:00:00.000Z'),
      appVersion: '2.4.1',
      platform: 'iOS',
      paymentStatus: 'Paid',
      purchases: [
        {
          id: 'p1',
          date: '2026-08-04T08:00:00.000Z',
          description: 'Annual Membership',
          plan: 'Annual Plan',
          amountLabel: 'RM 199',
          status: 'Paid',
        },
      ],
      redemptions: [
        {
          id: 'r1',
          date: '2026-08-06T09:00:00.000Z',
          merchantName: 'SoftGlow Studio',
          offerTitle: 'RM20 off spa package',
          status: 'Redeemed',
        },
      ],
      reviews: [
        {
          id: 'rv1',
          merchantName: 'SoftGlow Studio',
          rating: 5,
          text: 'Relaxing session, will return.',
          date: '2026-08-06T14:00:00.000Z',
        },
      ],
      supportNotes: [
        {
          id: 'n1',
          date: '2026-08-05T10:00:00.000Z',
          note: 'Welcome call completed. Member confirmed email.',
          addedBy: 'Faiz M.',
        },
      ],
    },
    {
      memberCode: 'IL-2026-004901',
      fullName: 'Tan Wei Ming',
      email: 'weiming.tan@outlook.com',
      phone: '016-284 1177',
      city: 'Subang Jaya',
      status: 'expired' as const,
      plan: 'Monthly' as const,
      joinedAt: new Date('2026-01-18T08:00:00.000Z'),
      expiresAt: new Date('2026-08-18T08:00:00.000Z'),
      totalPurchases: 3,
      totalRedemptions: 9,
      reviewsCount: 1,
      deviceName: 'Google Pixel 8',
      lastActiveAt: new Date('2026-08-18T08:00:00.000Z'),
      appVersion: '2.4.1',
      platform: 'Android',
      paymentStatus: 'Expired',
      purchases: [
        {
          id: 'p1',
          date: '2026-07-18T08:00:00.000Z',
          description: 'Monthly Membership',
          plan: 'Monthly Plan',
          amountLabel: 'RM 15',
          status: 'Paid',
        },
      ],
      redemptions: [
        {
          id: 'r1',
          date: '2026-08-01T12:00:00.000Z',
          merchantName: 'Urban Climb Studio',
          offerTitle: 'Day pass 20% off',
          status: 'Redeemed',
        },
      ],
      reviews: [],
      supportNotes: [
        {
          id: 'n1',
          date: '2026-08-19T09:00:00.000Z',
          note: 'Membership lapsed. Renewal reminder sent.',
          addedBy: 'System',
        },
      ],
    },
    {
      memberCode: 'IL-2026-004933',
      fullName: 'Arun Kumaran',
      email: 'arun.k@yahoo.com',
      phone: '019-330 8821',
      city: 'George Town',
      status: 'suspended' as const,
      plan: 'Annual' as const,
      joinedAt: new Date('2025-11-19T08:00:00.000Z'),
      expiresAt: new Date('2026-11-19T08:00:00.000Z'),
      totalPurchases: 2,
      totalRedemptions: 41,
      reviewsCount: 4,
      deviceName: 'iPhone 13',
      lastActiveAt: new Date('2026-08-01T11:00:00.000Z'),
      appVersion: '2.4.1',
      platform: 'iOS',
      paymentStatus: 'On hold',
      purchases: [
        {
          id: 'p1',
          date: '2025-11-19T08:00:00.000Z',
          description: 'Annual Membership',
          plan: 'Annual Plan',
          amountLabel: 'RM 120',
          status: 'Paid',
        },
      ],
      redemptions: [
        {
          id: 'r1',
          date: '2026-07-20T10:00:00.000Z',
          merchantName: 'Heritage Walk Melaka',
          offerTitle: 'Member entry pass',
          status: 'Redeemed',
        },
      ],
      reviews: [
        {
          id: 'rv1',
          merchantName: 'Heritage Walk Melaka',
          rating: 3,
          text: 'Good experience overall.',
          date: '2026-07-20T16:00:00.000Z',
        },
      ],
      supportNotes: [
        {
          id: 'n1',
          date: '2026-08-02T14:00:00.000Z',
          note: 'Account suspended pending policy review.',
          addedBy: 'Admin · David R.',
        },
      ],
    },
    {
      memberCode: 'IL-2026-004688',
      fullName: 'Siti Liyana',
      email: 'siti.liyana@gmail.com',
      phone: '011-2288 3390',
      city: 'Johor Bahru',
      status: 'inactive' as const,
      plan: 'None' as const,
      joinedAt: new Date('2026-08-16T08:00:00.000Z'),
      expiresAt: null,
      totalPurchases: 0,
      totalRedemptions: 0,
      reviewsCount: 0,
      deviceName: 'iPhone SE',
      lastActiveAt: new Date('2026-08-16T09:00:00.000Z'),
      appVersion: '2.4.1',
      platform: 'iOS',
      paymentStatus: 'On hold',
      purchases: [],
      redemptions: [],
      reviews: [],
      supportNotes: [
        {
          id: 'n1',
          date: '2026-08-16T10:00:00.000Z',
          note: 'Registered account. Awaiting first membership purchase.',
          addedBy: 'System',
        },
      ],
    },
  ]

  for (const member of sampleMembers) {
    await prisma.member.upsert({
      where: { memberCode: member.memberCode },
      update: {
        ...member,
        deletedAt: null,
      },
      create: member,
    })
  }

  const membersByCode = Object.fromEntries(
    (
      await prisma.member.findMany({
        where: { memberCode: { in: sampleMembers.map((m) => m.memberCode) } },
        select: { id: true, memberCode: true, fullName: true, email: true, phone: true },
      })
    ).map((m) => [m.memberCode, m]),
  )

  const sampleSubscriptions = [
    {
      subscriptionCode: 'SUB-2026-004821',
      memberCode: 'IL-2026-004821',
      plan: 'Annual' as const,
      billing: 'Annual' as const,
      startDate: new Date('2026-08-12T00:00:00.000Z'),
      expiryDate: new Date('2027-08-12T00:00:00.000Z'),
      status: 'active' as const,
      amount: 149,
      currency: 'MYR',
      payments: [
        {
          id: 'pay-4821-1',
          reference: 'TXN-IL-904821',
          paidAt: '2026-08-12',
          amountLabel: 'RM 149.00',
          status: 'Paid',
        },
      ],
    },
    {
      subscriptionCode: 'SUB-2026-004822',
      memberCode: 'IL-2026-004822',
      plan: 'Monthly' as const,
      billing: 'Monthly' as const,
      startDate: new Date('2026-08-09T00:00:00.000Z'),
      expiryDate: new Date('2026-09-09T00:00:00.000Z'),
      status: 'active' as const,
      amount: 18.9,
      currency: 'MYR',
      payments: [
        {
          id: 'pay-4822-1',
          reference: 'TXN-IL-904822',
          paidAt: '2026-08-09',
          amountLabel: 'RM 18.90',
          status: 'Paid',
        },
      ],
    },
    {
      subscriptionCode: 'SUB-2026-004823',
      memberCode: 'IL-2026-004823',
      plan: 'Annual' as const,
      billing: 'Annual' as const,
      startDate: new Date('2026-08-04T00:00:00.000Z'),
      expiryDate: new Date('2027-08-04T00:00:00.000Z'),
      status: 'active' as const,
      amount: 149,
      currency: 'MYR',
      payments: [
        {
          id: 'pay-4823-1',
          reference: 'TXN-IL-904823',
          paidAt: '2026-08-04',
          amountLabel: 'RM 149.00',
          status: 'Paid',
        },
      ],
    },
    {
      subscriptionCode: 'SUB-2026-004901',
      memberCode: 'IL-2026-004901',
      plan: 'Monthly' as const,
      billing: 'Monthly' as const,
      startDate: new Date('2026-07-18T00:00:00.000Z'),
      expiryDate: new Date('2026-08-18T00:00:00.000Z'),
      status: 'expired' as const,
      amount: 18.9,
      currency: 'MYR',
      payments: [
        {
          id: 'pay-4901-1',
          reference: 'TXN-IL-904901',
          paidAt: '2026-07-18',
          amountLabel: 'RM 18.90',
          status: 'Failed',
        },
      ],
    },
    {
      subscriptionCode: 'SUB-2026-004933',
      memberCode: 'IL-2026-004933',
      plan: 'Annual' as const,
      billing: 'Annual' as const,
      startDate: new Date('2025-11-19T00:00:00.000Z'),
      expiryDate: new Date('2026-11-19T00:00:00.000Z'),
      status: 'suspended' as const,
      amount: 149,
      currency: 'MYR',
      payments: [
        {
          id: 'pay-4933-1',
          reference: 'TXN-IL-904933',
          paidAt: '2025-11-19',
          amountLabel: 'RM 149.00',
          status: 'Paid',
        },
      ],
    },
    {
      subscriptionCode: 'SUB-2026-004824',
      memberCode: 'IL-2026-004821',
      plan: 'Monthly' as const,
      billing: 'Monthly' as const,
      startDate: new Date('2025-08-12T00:00:00.000Z'),
      expiryDate: new Date('2025-09-12T00:00:00.000Z'),
      status: 'expired' as const,
      amount: 18.9,
      currency: 'MYR',
      payments: [
        {
          id: 'pay-4824-1',
          reference: 'TXN-IL-804821',
          paidAt: '2025-08-12',
          amountLabel: 'RM 18.90',
          status: 'Paid',
        },
      ],
    },
  ]

  for (const sub of sampleSubscriptions) {
    const member = membersByCode[sub.memberCode]
    if (!member) continue
    const { memberCode: _code, ...data } = sub
    await prisma.subscription.upsert({
      where: { subscriptionCode: sub.subscriptionCode },
      update: {
        ...data,
        memberId: member.id,
      },
      create: {
        ...data,
        memberId: member.id,
      },
    })
  }

  const merchantsByCode = Object.fromEntries(
    (
      await prisma.merchant.findMany({
        where: { merchantCode: { in: sampleMerchants.map((m) => m.merchantCode) } },
        select: { id: true, merchantCode: true },
      })
    ).map((m) => [m.merchantCode, m]),
  )

  const offersByCode = Object.fromEntries(
    (
      await prisma.offer.findMany({
        where: { offerCode: { in: sampleOffers.map((o) => o.offerCode) } },
        select: { id: true, offerCode: true },
      })
    ).map((o) => [o.offerCode, o]),
  )

  const sampleRedemptions = [
    {
      redemptionCode: 'RED-001284',
      memberCode: 'IL-2026-004821',
      merchantCode: 'MRC-0148',
      offerCode: 'OFR-0108',
      redeemedAt: new Date('2026-08-11T10:15:00.000Z'),
      status: 'successful' as const,
      method: 'QR scan',
      verificationStatus: 'Verified',
      activity: [
        {
          id: 'a1',
          dateLabel: '11 AUG',
          description: 'QR scanned at Kedai Kopi Seri Wangi',
        },
      ],
    },
    {
      redemptionCode: 'RED-001285',
      memberCode: 'IL-2026-004822',
      merchantCode: 'MRC-0217',
      offerCode: 'OFR-0217',
      redeemedAt: new Date('2026-08-10T11:40:00.000Z'),
      status: 'successful' as const,
      method: 'Merchant code',
      verificationStatus: 'Verified',
      activity: [
        {
          id: 'a1',
          dateLabel: '10 AUG',
          description: 'Merchant code accepted at Ipoh White Coffee Co.',
        },
      ],
    },
    {
      redemptionCode: 'RED-001286',
      memberCode: 'IL-2026-004823',
      merchantCode: 'MRC-0203',
      offerCode: 'OFR-0203',
      redeemedAt: new Date('2026-08-06T09:20:00.000Z'),
      status: 'successful' as const,
      method: 'QR scan',
      verificationStatus: 'Verified',
      activity: [
        {
          id: 'a1',
          dateLabel: '06 AUG',
          description: 'Batik scarf discount redeemed',
        },
      ],
    },
    {
      redemptionCode: 'RED-001287',
      memberCode: 'IL-2026-004901',
      merchantCode: 'MRC-0176',
      offerCode: 'OFR-0176',
      redeemedAt: new Date('2026-08-01T12:05:00.000Z'),
      status: 'failed' as const,
      method: 'QR scan',
      verificationStatus: 'Rejected',
      activity: [
        {
          id: 'a1',
          dateLabel: '01 AUG',
          description: 'Redemption failed — voucher already expired',
        },
      ],
    },
    {
      redemptionCode: 'RED-001288',
      memberCode: 'IL-2026-004933',
      merchantCode: 'MRC-0091',
      offerCode: 'OFR-0091',
      redeemedAt: new Date('2026-07-20T10:30:00.000Z'),
      status: 'cancelled' as const,
      method: 'Merchant code',
      verificationStatus: 'Voided',
      activity: [
        {
          id: 'a1',
          dateLabel: '20 JUL',
          description: 'Redemption cancelled by merchant staff',
        },
      ],
    },
    {
      redemptionCode: 'RED-001289',
      memberCode: 'IL-2026-004821',
      merchantCode: 'MRC-0148',
      offerCode: 'OFR-0109',
      redeemedAt: new Date('2026-08-07T15:10:00.000Z'),
      status: 'successful' as const,
      method: 'QR scan',
      verificationStatus: 'Verified',
      activity: [
        {
          id: 'a1',
          dateLabel: '07 AUG',
          description: 'BOGO kaya toast redeemed',
        },
      ],
    },
  ]

  for (const item of sampleRedemptions) {
    const member = membersByCode[item.memberCode]
    const merchant = merchantsByCode[item.merchantCode]
    const offer = offersByCode[item.offerCode]
    if (!member || !merchant || !offer) continue
    const { memberCode: _m, merchantCode: _mc, offerCode: _o, ...data } = item
    await prisma.redemption.upsert({
      where: { redemptionCode: item.redemptionCode },
      update: {
        ...data,
        memberId: member.id,
        merchantId: merchant.id,
        offerId: offer.id,
      },
      create: {
        ...data,
        memberId: member.id,
        merchantId: merchant.id,
        offerId: offer.id,
      },
    })
  }

  const sampleReviews = [
    {
      key: 'seed-rev-4821',
      memberCode: 'IL-2026-004821',
      merchantCode: 'MRC-0148',
      rating: 5,
      text: 'Great coffee and very friendly service. Will return with friends.',
      submittedAt: new Date('2026-08-11T12:00:00.000Z'),
      status: 'published' as const,
    },
    {
      key: 'seed-rev-4822',
      memberCode: 'IL-2026-004822',
      merchantCode: 'MRC-0217',
      rating: 4,
      text: 'Nice ambience and fast service. White coffee set is excellent value.',
      submittedAt: new Date('2026-08-10T12:30:00.000Z'),
      status: 'published' as const,
    },
    {
      key: 'seed-rev-4823',
      memberCode: 'IL-2026-004823',
      merchantCode: 'MRC-0203',
      rating: 5,
      text: 'Beautiful batik selection and knowledgeable staff.',
      submittedAt: new Date('2026-08-06T14:00:00.000Z'),
      status: 'published' as const,
    },
    {
      key: 'seed-rev-4901',
      memberCode: 'IL-2026-004901',
      merchantCode: 'MRC-0176',
      rating: 2,
      text: 'Facility was crowded and the voucher process was confusing.',
      submittedAt: new Date('2026-08-01T16:00:00.000Z'),
      status: 'flagged' as const,
    },
    {
      key: 'seed-rev-4933',
      memberCode: 'IL-2026-004933',
      merchantCode: 'MRC-0091',
      rating: 3,
      text: 'Good experience overall, dessert was a nice touch.',
      submittedAt: new Date('2026-07-20T16:00:00.000Z'),
      status: 'pending' as const,
    },
    {
      key: 'seed-rev-4688',
      memberCode: 'IL-2026-004688',
      merchantCode: 'MRC-0148',
      rating: 1,
      text: 'Order took too long and staff seemed uninterested.',
      submittedAt: new Date('2026-08-16T11:00:00.000Z'),
      status: 'hidden' as const,
    },
  ]

  for (const item of sampleReviews) {
    const member = membersByCode[item.memberCode]
    const merchant = merchantsByCode[item.merchantCode]
    if (!member || !merchant) continue

    const existing = await prisma.review.findFirst({
      where: {
        memberId: member.id,
        merchantId: merchant.id,
        submittedAt: item.submittedAt,
      },
    })

    if (existing) {
      await prisma.review.update({
        where: { id: existing.id },
        data: {
          rating: item.rating,
          text: item.text,
          status: item.status,
          deletedAt: null,
        },
      })
    } else {
      await prisma.review.create({
        data: {
          memberId: member.id,
          merchantId: merchant.id,
          rating: item.rating,
          text: item.text,
          submittedAt: item.submittedAt,
          status: item.status,
        },
      })
    }
  }

  // Sync denormalized counters after seed
  for (const member of Object.values(membersByCode)) {
    const [totalRedemptions, reviewsCount] = await Promise.all([
      prisma.redemption.count({ where: { memberId: member.id, status: 'successful' } }),
      prisma.review.count({
        where: { memberId: member.id, deletedAt: null, status: { not: 'hidden' } },
      }),
    ])
    await prisma.member.update({
      where: { id: member.id },
      data: { totalRedemptions, reviewsCount },
    })
  }

  for (const merchant of Object.values(merchantsByCode)) {
    const [redeemedCount, redeemed30d, published] = await Promise.all([
      prisma.redemption.count({ where: { merchantId: merchant.id, status: 'successful' } }),
      prisma.redemption.count({
        where: {
          merchantId: merchant.id,
          status: 'successful',
          redeemedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.review.findMany({
        where: { merchantId: merchant.id, deletedAt: null, status: 'published' },
        select: { rating: true },
      }),
    ])
    const ratingsCount = published.length
    const rating =
      ratingsCount > 0
        ? Math.round(
            (published.reduce((sum, r) => sum + r.rating, 0) / ratingsCount) * 10,
          ) / 10
        : 0
    await prisma.merchant.update({
      where: { id: merchant.id },
      data: { redeemedCount, redeemed30d, rating, ratingsCount },
    })
  }

  for (const offer of Object.values(offersByCode)) {
    const redeemedCount = await prisma.redemption.count({
      where: { offerId: offer.id, status: 'successful' },
    })
    await prisma.offer.update({
      where: { id: offer.id },
      data: { redeemedCount },
    })
  }

  console.log('Seed completed')
  console.log(`Role: ${role.name}`)
  console.log(`Super Admin: ${user.email}`)
  console.log(`Admin users seeded: ${sampleAdminUsers.length + 1}`)
  console.log(`Merchants upserted: ${sampleMerchants.length}`)
  console.log(`Offers upserted: ${sampleOffers.length}`)
  console.log(`Members upserted: ${sampleMembers.length}`)
  console.log(`Subscriptions upserted: ${sampleSubscriptions.length}`)
  console.log(`Redemptions upserted: ${sampleRedemptions.length}`)
  console.log(`Reviews upserted: ${sampleReviews.length}`)

  const sampleCategories = [
    {
      name: 'Food & Beverage',
      slug: 'food-and-beverage',
      description: 'Kopitiams, cafés, restaurants and local food spots.',
      status: 'active' as const,
      displayOrder: 1,
    },
    {
      name: 'Retail & Crafts',
      slug: 'retail-and-crafts',
      description: 'Boutiques, galleries and handmade local goods.',
      status: 'active' as const,
      displayOrder: 2,
    },
    {
      name: 'Fitness',
      slug: 'fitness',
      description: 'Gyms, studios and sports facilities.',
      status: 'active' as const,
      displayOrder: 3,
    },
    {
      name: 'Beauty & Wellness',
      slug: 'beauty-and-wellness',
      description: 'Spas, salons and wellness experiences.',
      status: 'active' as const,
      displayOrder: 4,
    },
    {
      name: 'Services',
      slug: 'services',
      description: 'Professional and everyday local services.',
      status: 'active' as const,
      displayOrder: 5,
    },
    {
      name: 'Education',
      slug: 'education',
      description: 'Tuition, workshops and learning centres.',
      status: 'active' as const,
      displayOrder: 6,
    },
  ]

  for (const category of sampleCategories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        status: category.status,
        displayOrder: category.displayOrder,
        deletedAt: null,
      },
      create: category,
    })
  }

  // Ensure any merchant category strings map to Category rows and categoryId
  const distinctMerchantCategories = await prisma.merchant.findMany({
    where: { deletedAt: null },
    distinct: ['category'],
    select: { category: true },
  })

  for (const row of distinctMerchantCategories) {
    const name = row.category.trim()
    if (!name) continue
    const existing = await prisma.category.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    })
    if (!existing) {
      const slugBase = name
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      await prisma.category.create({
        data: {
          name,
          slug: slugBase || `category-${Date.now()}`,
          description: '',
          status: 'active',
          displayOrder: 100,
        },
      })
    }
  }

  const allCategories = await prisma.category.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
  })
  for (const category of allCategories) {
    await prisma.merchant.updateMany({
      where: {
        deletedAt: null,
        category: { equals: category.name, mode: 'insensitive' },
      },
      data: { categoryId: category.id, category: category.name },
    })
  }

  console.log(`Categories upserted: ${sampleCategories.length}`)
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
