'use client';

import { useCallback, useEffect, useState } from 'react';
import { settingsApi } from '../api';

export type SettingFieldMap<T> = Partial<Record<keyof T, string>>;

function parseValue(raw: string, fallback: unknown): unknown {
  if (typeof fallback === 'boolean') return raw === 'true';
  if (typeof fallback === 'number') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }
  return raw || fallback;
}

function serializeValue(val: unknown): string {
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (val === null || val === undefined) return '';
  return String(val);
}

export interface SettingTransforms<T> {
  fromDb?: Partial<Record<keyof T, (raw: string, defaults: T) => unknown>>;
  toDb?: Partial<Record<keyof T, (val: unknown) => string>>;
}

export function useAdminSettings<T extends Record<string, any>>(
  group: string,
  fieldMap: SettingFieldMap<T>,
  staticDefaults: T,
  transforms?: SettingTransforms<T>,
) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [values, setValues] = useState<T>(staticDefaults);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await settingsApi.getGroup(group);
        const rows = (res.data as { data?: { key: string; value: string }[] })?.data ?? [];
        const byKey = Object.fromEntries(rows.map((s) => [s.key, String(s.value ?? '')]));
        const next = { ...staticDefaults };
        for (const [field, key] of Object.entries(fieldMap) as [keyof T, string][]) {
          if (!key) continue;
          const raw = byKey[key];
          if (raw === undefined) continue;
          next[field] = (transforms?.fromDb?.[field]
            ? transforms.fromDb[field]!(raw, staticDefaults)
            : parseValue(raw, staticDefaults[field])) as T[keyof T];
        }
        if (!cancelled) setValues(next);
      } catch {
        // keep static defaults on load failure
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [group, fieldMap, staticDefaults, transforms]);

  const save = useCallback(
    async (data: T) => {
      setSaving(true);
      try {
        const settings = (Object.entries(fieldMap) as [keyof T, string | undefined][])
          .filter((entry): entry is [keyof T, string] => Boolean(entry[1]))
          .map(([field, key]) => ({
            key,
            value: transforms?.toDb?.[field]
              ? transforms.toDb[field]!(data[field])
              : serializeValue(data[field]),
          }));
        await settingsApi.bulkUpdate(settings);
        setValues(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } finally {
        setSaving(false);
      }
    },
    [fieldMap, transforms],
  );

  return { values, loading, saving, saved, save, setValues };
}
