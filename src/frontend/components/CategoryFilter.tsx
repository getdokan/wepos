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
import { POSCategory } from '../types';
import { RawHTML } from '@wordpress/element';
import { decodeHtmlEntities } from '../utils/helpers';

interface CategoryFilterProps {
  categories: POSCategory[];
  selectedCategory: POSCategory | null;
  onCategoryChange: (category: POSCategory | null) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
}) => {
  const allCategory = useMemo(() => ({ id: 'all', name: __('Category', 'wepos') }), []);

  const items = useMemo(() => [
    allCategory,
    ...categories
      .filter(cat => cat.id !== 0 && cat.name.toLowerCase() !== 'all categories')
      .map(cat => ({ id: cat.id.toString(), name: cat.name }))
  ], [categories, allCategory]);

  const selectedValue = useMemo(() => {
    if (!selectedCategory) return allCategory;
    return items.find(item => item.id === selectedCategory.id.toString()) || allCategory;
  }, [selectedCategory, items, allCategory]);

  return (
    <div className="w-fit">
    <Combobox
      items={items}
      value={selectedValue}
      onValueChange={(val: any) => {
        if (!val || val.id === 'all') {
          onCategoryChange(null);
        } else {
          const originalCategory = categories.find(
            (cat) => cat.id.toString() === val.id,
          );
          onCategoryChange(originalCategory || null);
        }
      }}
      itemToStringLabel={(item: any) => decodeHtmlEntities(item?.name || '')}
      itemToStringValue={(item: any) => item?.id}
    >
      <ComboboxInput placeholder={__('Select a category', 'wepos')} className={ cn( 'h-[30px]! max-w-[130px] border-none! cursor-pointer text-sm!', selectedCategory ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground' ) } />
      <ComboboxContent>
        <ComboboxList>
          {items.map((item) => (
            <ComboboxItem key={item.id} value={item}>
              <RawHTML>{item.name}</RawHTML>
            </ComboboxItem>
          ))}
        </ComboboxList>
        <ComboboxEmpty>{__('No category found.', 'wepos')}</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
    </div>
  );
};

export default CategoryFilter;
