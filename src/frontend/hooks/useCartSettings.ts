import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'wepos_cart_settings';

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

function loadSettings(): CartSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        columns: DEFAULT_SETTINGS.columns.map((defaultCol) => {
          const savedCol = parsed.columns?.find((c: CartColumnConfig) => c.key === defaultCol.key);
          if (!savedCol) return defaultCol;
          return {
            ...defaultCol,
            ...savedCol,
            subOptions: defaultCol.subOptions?.map((defaultSub) => {
              const savedSub = savedCol.subOptions?.find((s: ColumnSubOption) => s.key === defaultSub.key);
              return savedSub ? { ...defaultSub, ...savedSub } : defaultSub;
            }),
          };
        }),
      };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings: CartSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
}

export function useCartSettings() {
  const [settings, setSettings] = useState<CartSettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<CartSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const toggleColumn = useCallback((key: string) => {
    setSettings((prev) => ({
      ...prev,
      columns: prev.columns.map((col) =>
        col.key === key ? { ...col, enabled: !col.enabled } : col,
      ),
    }));
  }, []);

  const toggleSubOption = useCallback((columnKey: string, subKey: string) => {
    setSettings((prev) => ({
      ...prev,
      columns: prev.columns.map((col) =>
        col.key === columnKey
          ? {
              ...col,
              subOptions: col.subOptions?.map((sub) =>
                sub.key === subKey ? { ...sub, enabled: !sub.enabled } : sub,
              ),
            }
          : col,
      ),
    }));
  }, []);

  const restoreDefaults = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
  }, []);

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
