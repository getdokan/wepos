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
import { decodeHtmlEntities } from '../utils/helpers';
import { RawHTML } from '@wordpress/element';

interface TaxonomyItem {
  id: number;
  name: string;
}

interface TaxonomyFilterProps {
  items: TaxonomyItem[];
  selectedItem: TaxonomyItem | null;
  onItemChange: (item: TaxonomyItem | null) => void;
  placeholder: string;
  allLabel: string;
  emptyLabel?: string;
}

const TaxonomyFilter: React.FC<TaxonomyFilterProps> = ({
  items,
  selectedItem,
  onItemChange,
  placeholder,
  allLabel,
  emptyLabel,
}) => {
  const allOption = useMemo(() => ({ id: 'all', name: allLabel }), [allLabel]);

  const comboboxItems = useMemo(
    () => [
      allOption,
      ...items.map((item) => ({ id: item.id.toString(), name: item.name })),
    ],
    [items, allOption],
  );

  const selectedValue = useMemo(() => {
    if (!selectedItem) return allOption;
    return (
      comboboxItems.find((item) => item.id === selectedItem.id.toString()) ||
      allOption
    );
  }, [selectedItem, comboboxItems, allOption]);

  return (
    <Combobox
      items={comboboxItems}
      value={selectedValue}
      onValueChange={(val: any) => {
        if (!val || val.id === 'all') {
          onItemChange(null);
        } else {
          const original = items.find(
            (item) => item.id.toString() === val.id,
          );
          onItemChange(original || null);
        }
      }}
      itemToStringLabel={(item: any) => decodeHtmlEntities(item?.name || '')}
      itemToStringValue={(item: any) => item?.id}
    >
      <ComboboxInput
        placeholder={placeholder}
        className={cn(
          'h-[30px]! bg-primary/10 border-none! text-primary cursor-pointer',
        )}
      />
      <ComboboxContent>
        <ComboboxList>
          {comboboxItems.map((item) => (
            <ComboboxItem key={item.id} value={item}>
              <RawHTML>{item.name}</RawHTML>
            </ComboboxItem>
          ))}
        </ComboboxList>
        <ComboboxEmpty>
          {emptyLabel || __('No items found.', 'wepos')}
        </ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  );
};

export default TaxonomyFilter;
