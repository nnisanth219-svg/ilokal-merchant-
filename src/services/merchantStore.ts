import type {
  Merchant,
  MerchantFormValues,
  PublishStatus,
} from '../types/merchant'

export function emptyMerchantForm(): MerchantFormValues {
  return {
    businessName: 'Kedai Kopi Seri Wangi',
    legalName: 'Seri Wangi Enterprise',
    category: 'Food & Beverage',
    subCategories: 'Kopitiam, Halal, Breakfast',
    description:
      'Third-generation kopitiam serving white coffee, kaya toast and local breakfast.',
    registrationNo: 'SSM202301004521',
    priceRange: 'RM RM',
    publishStatus: 'pending',
    featured: false,
    address: 'Kampung Baru, Kuala Lumpur',
    postcode: '50300',
    latitude: '3.1612',
    longitude: '101.7068',
    outletType: 'single',
    logoUrl: null,
    coverUrl: null,
    galleryUrls: [],
    picName: 'Encik Rosli bin Ahmad',
    phone: '012-338 9021',
    email: 'seriwangi@gmail.com',
    whatsapp: '012-338 9021',
    hoursWeekday: '7:00 – 18:00',
    hoursWeekend: '7:00 – 15:00',
    hoursHoliday: 'Closed',
    offerSummary: '15% off total bill — members only',
  }
}

export function merchantToFormValues(merchant: Merchant): MerchantFormValues {
  const publishStatus: PublishStatus =
    merchant.status === 'active'
      ? 'active'
      : merchant.status === 'inactive'
        ? 'inactive'
        : 'pending'

  return {
    businessName: merchant.businessName,
    legalName: merchant.legalName,
    category: merchant.category,
    subCategories: merchant.subCategories.join(', '),
    description: merchant.description,
    registrationNo: merchant.registrationNo,
    priceRange: merchant.priceRange,
    publishStatus,
    featured: merchant.featured,
    address: merchant.address,
    postcode: merchant.postcode,
    latitude: merchant.latitude,
    longitude: merchant.longitude,
    outletType: merchant.outletType,
    logoUrl: merchant.logoUrl,
    coverUrl: merchant.coverUrl,
    galleryUrls: [...merchant.galleryUrls],
    picName: merchant.picName,
    phone: merchant.phone,
    email: merchant.email,
    whatsapp: merchant.whatsapp,
    hoursWeekday: merchant.hours.weekday,
    hoursWeekend: merchant.hours.weekend,
    hoursHoliday: merchant.hours.publicHoliday,
    offerSummary: merchant.offers[0]?.title ?? '',
  }
}
