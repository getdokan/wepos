import { useState, useEffect, useCallback } from 'react';
import { posAPI } from '../api';

const LEGACY_STORAGE_KEY = 'wepos_cart_settings';

export interface ColumnSubOption {
  key: string;
  label: string;
  enabled: boolean;
}

export interface CartColumnConfig {
  key: string;
  label: string;
  enabled: boolean;
  subOptions?: ColumnSubOption[];
}

export interface CartSettings {
  autoShowReceipt: boolean;
  autoPrintReceipt: boolean;
  quickDiscounts: string;
  columns: CartColumnConfig[];
}

const DEFAULT_SETTINGS: CartSettings = {
  autoShowReceipt: true,
  autoPrintReceipt: true,
  quickDiscounts: '5,10,15,20',
  columns: [
    {
      key: 'qty',
      label: 'Qty',
      enabled: true,
      subOptions: [
        { key: 'split', label: 'Split', enabled: false },
      ],
    },
    {
      key: 'name',
      label: 'Name',
      enabled: true,
      subOptions: [
        { key: 'sku', label: 'SKU', enabled: true },
      ],
    },
    { key: 'sku', label: 'SKU', enabled: false },
    {
      key: 'price',
      label: 'Price',
      enabled: true,
      subOptions: [
        { key: 'on_sale', label: 'On Sale', enabled: true },
      ],
    },
    { key: 'regular_price', label: 'Regular Price', enabled: false },
    {
      key: 'subtotal',
      label: 'Subtotal',
      enabled: false,
      subOptions: [
        { key: 'tax', label: 'Tax', enabled: false },
      ],
    },
    {
      key: 'total',
      label: 'Total',
      enabled: true,
      subOptions: [
        { key: 'tax', label: 'Tax', enabled: false },
        { key: 'on_sale', label: 'On Sale', enabled: true },
      ],
    },
    { key: 'actions', label: 'Actions', enabled: true },
  ],
};

function mergeColumns(
  defaultColumns: CartColumnConfig[],
  saved?: CartColumnConfig[],
): CartColumnConfig[] {
  return defaultColumns.map((defaultCol) => {
    const savedCol = saved?.find((c) => c.key === defaultCol.key);
    if (!savedCol) return defaultCol;
    return {
      ...defaultCol,
      ...savedCol,
      subOptions: defaultCol.subOptions?.map((defaultSub) => {
        const savedSub = savedCol.subOptions?.find(
          (s: ColumnSubOption) => s.key === defaultSub.key,
        );
        return savedSub ? { ...defaultSub, ...savedSub } : defaultSub;
      }),
    };
  });
}

function mergeWithDefaults(raw: unknown): CartSettings | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const parsed = raw as Partial<CartSettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...parsed,
    columns: mergeColumns(DEFAULT_SETTINGS.columns, parsed.columns),
  };
}

function readLegacyLocalStorage(): CartSettings | null {
  try {
    const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) return null;
    return mergeWithDefaults(JSON.parse(stored));
  } catch {
    return null;
  }
}

function clearLegacyLocalStorage() {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function useCartSettings() {
  const [settings, setSettings] = useState<CartSettings>(
    () => readLegacyLocalStorage() ?? { ...DEFAULT_SETTINGS },
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await posAPI.settings.getSettings();
        const remote = mergeWithDefaults(
          (response as unknown as { wepos_cashier?: unknown }).wepos_cashier,
        );

        if (cancelled) return;

        if (remote) {
          setSettings(remote);
        }

        const legacy = readLegacyLocalStorage();
        if (legacy && !remote) {
          try {
            await posAPI.settings.updateSettings({ wepos_cashier: legacy });
            setSettings(legacy);
          } catch {
            // ignore
          }
        }
        clearLegacyLocalStorage();
      } catch {
        // keep defaults / legacy already in state
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: CartSettings) => {
    try {
      await posAPI.settings.updateSettings({ wepos_cashier: next });
    } catch {
      // ignore — UI reflects last user input
    }
  }, []);

  const updateSettings = useCallback(
    (updates: Partial<CartSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...updates };
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const toggleColumn = useCallback(
    (key: string) => {
      setSettings((prev) => {
        const next = {
          ...prev,
          columns: prev.columns.map((col) =>
            col.key === key ? { ...col, enabled: !col.enabled } : col,
          ),
        };
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const toggleSubOption = useCallback(
    (columnKey: string, subKey: string) => {
      setSettings((prev) => {
        const next = {
          ...prev,
          columns: prev.columns.map((col) =>
            col.key === columnKey
              ? {
                  ...col,
                  subOptions: col.subOptions?.map((sub) =>
                    sub.key === subKey
                      ? { ...sub, enabled: !sub.enabled }
                      : sub,
                  ),
                }
              : col,
          ),
        };
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const restoreDefaults = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
    void persist({ ...DEFAULT_SETTINGS });
  }, [persist]);

  const isColumnEnabled = useCallback(
    (key: string) => settings.columns.find((c) => c.key === key)?.enabled ?? true,
    [settings.columns],
  );

  const isSubOptionEnabled = useCallback(
    (columnKey: string, subKey: string) => {
      const col = settings.columns.find((c) => c.key === columnKey);
      return col?.subOptions?.find((s) => s.key === subKey)?.enabled ?? false;
    },
    [settings.columns],
  );

  return {
    settings,
    updateSettings,
    toggleColumn,
    toggleSubOption,
    restoreDefaults,
    isColumnEnabled,
    isSubOptionEnabled,
  };
}
