import React, { useState, useEffect, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  Button,
  Input,
  Label,
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  Separator,
} from '@wedevs/plugin-ui';
import { Minus, ChevronUp, ChevronDown } from 'lucide-react';
import { POSOrderMetaItem } from '../types';
import apiFetch from '@wordpress/api-fetch';

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
  const [currencySearch, setCurrencySearch] = useState('');
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [transactionId, setTransactionId] = useState('');
  const [metaItems, setMetaItems] = useState<POSOrderMetaItem[]>([]);
  const [metaExpanded, setMetaExpanded] = useState(true);

  // Fetch currencies from WooCommerce REST API
  useEffect(() => {
    if (currencies.length > 0) return;

    const fetchCurrencies = async () => {
      try {
        const response = (await apiFetch({
          path: `/${window.wepos.rest.wcversion}/data/currencies`,
          method: 'GET',
        })) as Array<{ code: string; name: string; symbol: string }>;

        const options = response.map((c) => ({
          value: c.code,
          label: decodeHTMLEntities(`${c.name} (${c.symbol})`),
          symbol: decodeHTMLEntities(c.symbol),
        }));
        setCurrencies(options);
      } catch {
        // Fallback: use current store currency
        const symbol = window.wepos?.currency_format_symbol || '$';
        setCurrencies([{ value: 'default', label: `${__('Default currency', 'wepos')} (${symbol})`, symbol }]);
      }
    };

    fetchCurrencies();
  }, [currencies.length]);

  useEffect(() => {
    if (isOpen) {
      const items = initialMetaData.length > 0
        ? initialMetaData
        : [{ key: '', value: '' }];
      setMetaItems(items);
      setCurrency(initialCurrency);
    }
  }, [isOpen, initialMetaData, initialCurrency]);

  const selectedCurrencyItem = useMemo(
    () => currencies.find((c) => c.value === currency) || null,
    [currencies, currency],
  );

  const filteredCurrencies = useMemo(() => {
    if (!currencySearch.trim()) return currencies;
    const query = currencySearch.toLowerCase();
    return currencies.filter((c) => c.label.toLowerCase().includes(query));
  }, [currencies, currencySearch]);

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
    <Modal
      open={isOpen}
      onClose={handleClose}
      showCloseButton={true}
      closeOnOverlayClick={false}
      closeOnEscape={true}
      className="max-w-160 p-0!"
    >
      <ModalHeader className="px-6 py-5">
        <ModalTitle className="text-lg font-bold text-foreground">
          {__('Order Meta', 'wepos')}
        </ModalTitle>
      </ModalHeader>

      <Separator />

      <div className="space-y-4 px-6 py-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block text-sm font-medium">
              {__('Currency', 'wepos')}
            </Label>
            <Combobox
              items={filteredCurrencies}
              value={selectedCurrencyItem}
              onValueChange={(val: any) => {
                setCurrency(val?.value ?? '');
                setCurrencySearch('');
              }}
              itemToStringLabel={(item: any) => item?.label}
              itemToStringValue={(item: any) => item?.value}
            >
              <ComboboxInput
                placeholder={__('Select currency', 'wepos')}
                onInput={(e: React.FormEvent<HTMLInputElement>) =>
                  setCurrencySearch((e.target as HTMLInputElement).value)
                }
              />
              <ComboboxContent>
                <ComboboxList>
                  {filteredCurrencies.map((item) => (
                    <ComboboxItem key={item.value} value={item}>
                      {item.label}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
                <ComboboxEmpty>{__('No currency found.', 'wepos')}</ComboboxEmpty>
              </ComboboxContent>
            </Combobox>
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

      <ModalFooter className="flex justify-end gap-2 px-6 py-4">
        <Button variant="outline" onClick={handleClose}>
          {__('Cancel', 'wepos')}
        </Button>
        <Button onClick={handleSave}>
          {__('Save', 'wepos')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default OrderMetaModal;
