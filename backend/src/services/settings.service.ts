import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import type { AppSettingsState, SettingKey } from '../types/settings.js'
import { DEFAULT_SETTINGS, SETTING_KEYS } from '../types/settings.js'
import { AppError } from '../utils/errors.js'
import {
  defaultForKey,
  isSettingKey,
  parseFullSettingsBody,
  parseSettingsSection,
} from '../validation/settings.validation.js'

function asSectionValue(
  key: SettingKey,
  value: Prisma.JsonValue,
): AppSettingsState[SettingKey] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaultForKey(key)
  }
  return { ...defaultForKey(key), ...(value as Record<string, unknown>) } as AppSettingsState[SettingKey]
}

async function ensureDefaults(): Promise<void> {
  for (const key of SETTING_KEYS) {
    const existing = await prisma.setting.findUnique({ where: { key } })
    if (!existing) {
      await prisma.setting.create({
        data: {
          key,
          value: DEFAULT_SETTINGS[key] as unknown as Prisma.InputJsonValue,
        },
      })
    }
  }
}

export async function getAllSettings(): Promise<AppSettingsState> {
  await ensureDefaults()
  const rows = await prisma.setting.findMany({
    where: { key: { in: SETTING_KEYS } },
  })
  const byKey = new Map(rows.map((r) => [r.key, r.value]))
  return {
    general: asSectionValue('general', byKey.get('general') ?? null) as AppSettingsState['general'],
    security: asSectionValue('security', byKey.get('security') ?? null) as AppSettingsState['security'],
    notifications: asSectionValue(
      'notifications',
      byKey.get('notifications') ?? null,
    ) as AppSettingsState['notifications'],
  }
}

export async function getSettingByKey(key: string): Promise<AppSettingsState[SettingKey]> {
  if (!isSettingKey(key)) throw new AppError(404, 'Unknown setting key')
  await ensureDefaults()
  const row = await prisma.setting.findUnique({ where: { key } })
  return asSectionValue(key, row?.value ?? null)
}

export async function updateSettingByKey(
  key: string,
  body: unknown,
): Promise<AppSettingsState[SettingKey]> {
  if (!isSettingKey(key)) throw new AppError(404, 'Unknown setting key')
  const value = parseSettingsSection(key, body)
  await ensureDefaults()
  const row = await prisma.setting.upsert({
    where: { key },
    update: { value: value as unknown as Prisma.InputJsonValue },
    create: {
      key,
      value: value as unknown as Prisma.InputJsonValue,
    },
  })
  return asSectionValue(key, row.value)
}

export async function updateSettingsPartial(
  body: unknown,
): Promise<AppSettingsState> {
  const partial = parseFullSettingsBody(body)
  await ensureDefaults()
  for (const key of SETTING_KEYS) {
    const section = partial[key]
    if (!section) continue
    await prisma.setting.upsert({
      where: { key },
      update: { value: section as unknown as Prisma.InputJsonValue },
      create: {
        key,
        value: section as unknown as Prisma.InputJsonValue,
      },
    })
  }
  return getAllSettings()
}
