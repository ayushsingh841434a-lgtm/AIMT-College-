import { db } from "./db";

export const SETTING_KEYS = ["siteName", "supportEmail", "allowRegistration", "sessionDays"] as const;

/** Read a single setting value by key, returning `fallback` when unset. */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const setting = await db.setting.findUnique({ where: { key } });
  if (!setting) return fallback;
  return (setting.value as unknown as T) ?? fallback;
}

/** Read several settings at once, keyed by the requested key names. */
export async function getSettingsMap(keys: string[]): Promise<Record<string, unknown>> {
  const rows = await db.setting.findMany({ where: { key: { in: keys } } });
  const map: Record<string, unknown> = {};
  for (const row of rows) {
    map[row.key] = row.value as unknown;
  }
  return map;
}
