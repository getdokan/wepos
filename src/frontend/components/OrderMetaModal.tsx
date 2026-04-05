import React, { useState, useEffect, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  SmartSelect,
  Separator,
} from '@wedevs/plugin-ui';
import { Minus, ChevronUp, ChevronDown } from 'lucide-react';
import { POSOrderMetaItem, POSSettings } from '../types';
import { PRODUCTS_STORE_NAME } from '../store';

interface CurrencyOption {
  value: string;
  label: string;
  symbol: string;
}

interface OrderMetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (metaData: POSOrderMetaItem[], currency?: string, currencySymbol?: string, transactionId?: string) => void;
  initialMetaData: POSOrderMetaItem[];
  initialCurrency?: string;
}

/**
 * Decode HTML entities like &#x62f; or &fnof; into real characters.
 */
const decodeHTMLEntities = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

const OrderMetaModal: React.FC<OrderMetaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMetaData,
  initialCurrency = '',
}) => {
  const [currency, setCurrency] = useState(initialCurrency);
  const [transactionId, setTransactionId] = useState('');
  const [metaItems, setMetaItems] = useState<POSOrderMetaItem[]>([]);
  const [metaExpanded, setMetaExpanded] = useState(true);

  // Build currency options from settings store (already fetched on POS init)
  const settings = useSelect(
    (select) => (select(PRODUCTS_STORE_NAME) as any).getSettings() as POSSettings,
    [],
  );

  const currencies = useMemo<CurrencyOption[]>(() => {
    if (settings?.currencies && Object.keys(settings.currencies).length > 0) {
      return Object.entries(settings.currencies).map(([code, data]) => ({
        value: code,
        label: decodeHTMLEntities(`${data.name} (${data.symbol})`),
        symbol: decodeHTMLEntities(data.symbol),
      }));
    }
    // Fallback: use current store currency
    const symbol = window.wepos?.currency_format_symbol || '$';
    return [{ value: 'default', label: `${__('Default currency', 'wepos')} (${symbol})`, symbol }];
  }, [settings?.currencies]);

  useEffect(() => {
    if (isOpen) {
      const items = initialMetaData.length > 0
        ? initialMetaData
        : [{ key: '', value: '' }];
      setMetaItems(items);
      setCurrency(initialCurrency);
    }
  }, [isOpen, initialMetaData, initialCurrency]);

  const currencyOptions = useMemo(
    () => currencies.map((c) => ({ value: c.value, label: c.label })),
    [currencies],
  );

  const handleAddRow = () => {
    setMetaItems([...metaItems, { key: '', value: '' }]);
  };

  const handleRemoveRow = (index: number) => {
    setMetaItems(metaItems.filter((_, i) => i !== index));
  };

  const handleMetaChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...metaItems];
    updated[index] = { ...updated[index], [field]: val };
    setMetaItems(updated);
  };

  const handleSave = () => {
    const finalMeta = metaItems.filter((item) => item.key.trim() !== '');
    const selectedSymbol = currencies.find((c) => c.value === currency);
    onSave(finalMeta, currency || undefined, selectedSymbol?.symbol || undefined, transactionId || undefined);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()} dismissible={false}>
    <DialogContent className="max-w-160 p-0!">
      <DialogHeader className="border-b border-border px-6 py-5">
        <DialogTitle className="text-lg font-bold text-foreground">
          {__('Order Meta', 'wepos')}
        </DialogTitle>
      </DialogHeader>

      <Separator />

      <div className="space-y-4 px-6 py-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block text-sm font-medium">
              {__('Currency', 'wepos')}
            </Label>
            <SmartSelect
              options={currencyOptions}
              value={currency}
              onValueChange={(val) => setCurrency(val)}
              placeholder={__('Select currency', 'wepos')}
              emptyMessage={__('No currency found.', 'wepos')}
              showClear
              className="w-full"
            />
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">
              {__('Transaction ID', 'wepos')}
            </Label>
            <Input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button
            type="button"
            className="flex items-center gap-1 text-sm font-medium text-foreground cursor-pointer bg-transparent border-none p-0"
            onClick={() => setMetaExpanded(!metaExpanded)}
          >
            {__('Meta Data', 'wepos')}
            {metaExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {metaExpanded && (
            <>
              <div className="mt-3 space-y-3">
                {metaItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-20">
                      <Label className="mb-1 block text-xs text-muted-foreground">
                        {__('ID', 'wepos')}
                      </Label>
                      <Input
                        type="text"
                        value={item.id?.toString() || ''}
                        readOnly
                        disabled
                        className="text-sm bg-muted"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="mb-1 block text-xs text-muted-foreground">
                        {__('Key', 'wepos')}
                      </Label>
                      <Input
                        type="text"
                        value={item.key}
                        onChange={(e) => handleMetaChange(index, 'key', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="mb-1 block text-xs text-muted-foreground">
                        {__('Value', 'wepos')}
                      </Label>
                      <Input
                        type="text"
                        value={item.value}
                        onChange={(e) => handleMetaChange(index, 'value', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="mt-5 shrink-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => handleRemoveRow(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={handleAddRow}
              >
                {__('Add meta data', 'wepos')}
              </Button>
            </>
          )}
        </div>
      </div>

      <DialogFooter className="border-t border-border flex justify-end gap-2 px-6 py-4">
        <Button variant="outline" onClick={handleClose}>
          {__('Cancel', 'wepos')}
        </Button>
        <Button onClick={handleSave}>
          {__('Save', 'wepos')}
        </Button>
      </DialogFooter>
    </DialogContent>
    </Dialog>
  );
};

export default OrderMetaModal;
