import React, { useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { SmartSelect, cn } from '@wedevs/plugin-ui';
import { POSCategory } from '../types';
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
  const options = useMemo(() => [
    { value: 'all', label: decodeHtmlEntities(__('Category', 'wepos')) },
    ...categories
      .filter(cat => cat.id !== 0 && cat.name.toLowerCase() !== 'all categories')
      .map(cat => ({ value: cat.id.toString(), label: decodeHtmlEntities(cat.name) }))
  ], [categories]);

  return (
    <div className="w-fit shrink-0">
      <SmartSelect
        options={options}
        value={selectedCategory ? selectedCategory.id.toString() : 'all'}
        onValueChange={(val) => {
          if (val === 'all') {
            onCategoryChange(null);
          } else {
            const originalCategory = categories.find(
              (cat) => cat.id.toString() === val,
            );
            onCategoryChange(originalCategory || null);
          }
        }}
        placeholder={__('Select a category', 'wepos')}
        emptyMessage={__('No category found.', 'wepos')}
        disableSearch
        className={cn(
          'h-[30px]! max-w-[130px] border-none! cursor-pointer text-sm!',
          selectedCategory ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
        )}
      />
    </div>
  );
};

export default CategoryFilter;
