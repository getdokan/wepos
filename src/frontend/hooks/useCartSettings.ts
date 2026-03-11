import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'wepos_cart_settings';

export interface CartColumnConfig {
  key: string;
  label: string;
  enabled: boolean;
  hasDisplayOptions?: boolean;
  displayOption?: 'buttons' | 'input';
}

export interface CartSettings {
  autoShowReceipt: boolean;
  autoPrintReceipt: boolean;
  columns: CartColumnConfig[];
}

const DEFAULT_SETTINGS: CartSettings = {
  autoShowReceipt: true,
  autoPrintReceipt: true,
  columns: [
    { key: 'qty', label: 'Qty', enabled: true, hasDisplayOptions: true, displayOption: 'buttons' },
    { key: 'name', label: 'Name', enabled: true, hasDisplayOptions: true, displayOption: 'buttons' },
    { key: 'sku', label: 'SKU', enabled: false },
    { key: 'price', label: 'Price', enabled: true, hasDisplayOptions: true, displayOption: 'buttons' },
    { key: 'regular_price', label: 'Regular Price', enabled: false },
    { key: 'subtotal', label: 'Subtotal', enabled: false, hasDisplayOptions: true, displayOption: 'buttons' },
    { key: 'total', label: 'Total', enabled: true, hasDisplayOptions: true, displayOption: 'buttons' },
    { key: 'actions', label: 'Actions', enabled: true },
  ],
};

function loadSettings(): CartSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle new keys added in future updates
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        columns: DEFAULT_SETTINGS.columns.map((defaultCol) => {
          const savedCol = parsed.columns?.find((c: CartColumnConfig) => c.key === defaultCol.key);
          return savedCol ? { ...defaultCol, ...savedCol } : defaultCol;
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

  const setColumnDisplayOption = useCallback((key: string, option: 'buttons' | 'input') => {
    setSettings((prev) => ({
      ...prev,
      columns: prev.columns.map((col) =>
        col.key === key ? { ...col, displayOption: option } : col,
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

  return {
    settings,
    updateSettings,
    toggleColumn,
    setColumnDisplayOption,
    restoreDefaults,
    isColumnEnabled,
  };
}
