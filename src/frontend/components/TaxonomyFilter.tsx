import React, { useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { SmartSelect, cn } from '@wedevs/plugin-ui';
import { decodeHtmlEntities } from '../utils/helpers';

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
  const options = useMemo(
    () => [
      { value: 'all', label: decodeHtmlEntities(allLabel) },
      ...items.map((item) => ({ value: item.id.toString(), label: decodeHtmlEntities(item.name) })),
    ],
    [items, allLabel],
  );

  return (
    <div className="w-fit shrink-0">
      <SmartSelect
        options={options}
        value={selectedItem ? selectedItem.id.toString() : 'all'}
        onValueChange={(val) => {
          if (val === 'all') {
            onItemChange(null);
          } else {
            const original = items.find(
              (item) => item.id.toString() === val,
            );
            onItemChange(original || null);
          }
        }}
        placeholder={placeholder}
        emptyMessage={emptyLabel || __('No items found.', 'wepos')}
        disableSearch
        className={cn(
          'h-[30px]! max-w-[130px] border-none! cursor-pointer text-sm!',
          selectedItem ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
        )}
      />
    </div>
  );
};

export default TaxonomyFilter;
