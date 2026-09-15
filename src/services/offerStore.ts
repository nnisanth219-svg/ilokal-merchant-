import type { Offer, OfferFormValues } from '../types/offer'

export function emptyOfferForm(merchantId = ''): OfferFormValues {
  return {
    merchantId,
    title: '15% Off Total Bill',
    description: 'Members receive 15% off their total dine-in bill.',
    offerType: 'percentage',
    benefitValue: '15%',
    eligibility: 'iLokal members only',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    redemptionLimit: '1 per member per day',
    status: 'live',
  }
}

export function offerToFormValues(offer: Offer): OfferFormValues {
  return {
    merchantId: offer.merchantId,
    title: offer.title,
    description: offer.description,
    offerType: offer.offerType,
    benefitValue: offer.benefitValue,
    eligibility: offer.eligibility,
    validFrom: offer.validFrom,
    validTo: offer.validTo,
    redemptionLimit: offer.redemptionLimit,
    status: offer.status === 'deleted' ? 'draft' : offer.status,
  }
}
