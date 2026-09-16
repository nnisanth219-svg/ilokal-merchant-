import { AppError } from '../utils/errors.js'

export interface GeocodeResult {
  latitude: string
  longitude: string
  displayName: string
}

export async function geocodeAddress(query: string): Promise<GeocodeResult> {
  const q = query.trim()
  if (!q) throw new AppError(400, 'An address is required to confirm location')

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'iLokal-Admin/1.0 (https://ilokal.my)',
    },
  })

  if (!response.ok) {
    throw new AppError(502, 'Unable to look up that address right now')
  }

  const payload = (await response.json()) as Array<{
    lat?: string
    lon?: string
    display_name?: string
  }>

  const hit = Array.isArray(payload) ? payload[0] : undefined
  if (!hit?.lat || !hit?.lon) {
    throw new AppError(404, 'No map location matched that address')
  }

  return {
    latitude: hit.lat,
    longitude: hit.lon,
    displayName: hit.display_name ?? q,
  }
}
