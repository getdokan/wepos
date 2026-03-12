import React, { useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  cn,
} from '@wedevs/plugin-ui';

export type StockStatus = 'instock' | 'outofstock' | 'onbackorder';

interface StockStatusOption {
  id: string;
  name: string;
}

interface StockStatusFilterProps {
  selectedStatus: StockStatus | null;
  onStatusChange: (status: StockStatus | null) => void;
}

const StockStatusFilter: React.FC<StockStatusFilterProps> = ({
  selectedStatus,
  onStatusChange,
}) => {
  const items: StockStatusOption[] = useMemo(
    () => [
      { id: 'all', name: __('Stock Status', 'wepos') },
      { id: 'instock', name: __('In Stock', 'wepos') },
      { id: 'outofstock', name: __('Out of Stock', 'wepos') },
      { id: 'onbackorder', name: __('On Backorder', 'wepos') },
    ],
    [],
  );

  const selectedValue = useMemo(() => {
    if (!selectedStatus) return items[0];
    return items.find((item) => item.id === selectedStatus) || items[0];
  }, [selectedStatus, items]);

  return (
    <Combobox
      items={items}
      value={selectedValue}
      onValueChange={(val: any) => {
        if (!val || val.id === 'all') {
          onStatusChange(null);
        } else {
          onStatusChange(val.id as StockStatus);
        }
      }}
      itemToStringLabel={(item: any) => item?.name || ''}
      itemToStringValue={(item: any) => item?.id}
    >
      <ComboboxInput
        placeholder={__('Stock Status', 'wepos')}
        className={cn(
          'h-[30px]! bg-primary/10 border-none! text-primary cursor-pointer',
        )}
      />
      <ComboboxContent>
        <ComboboxList>
          {items.map((item) => (
            <ComboboxItem key={item.id} value={item}>
              {item.name}
            </ComboboxItem>
          ))}
        </ComboboxList>
        <ComboboxEmpty>{__('No option found.', 'wepos')}</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  );
};

export default StockStatusFilter;
