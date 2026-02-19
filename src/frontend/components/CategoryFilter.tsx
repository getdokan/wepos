import React from 'react';
import { __ } from '@wordpress/i18n';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@wedevs/plugin-ui';
import { POSCategory } from '../types';

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
  return (
    <div className="w-full md:w-48">
      <Select
        value={selectedCategory?.id.toString() || ''}
        onValueChange={(value) => {
          if (value === '' || value === 'all') {
            onCategoryChange(null);
          } else {
            const category =
              categories.find((cat) => cat.id.toString() === value) || null;
            onCategoryChange(category);
          }
        }}
      >
        <SelectTrigger className="h-10 w-full border-none bg-transparent shadow-none focus-visible:ring-0">
          <SelectValue placeholder={__('All Categories', 'wepos')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{__('All Categories', 'wepos')}</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id.toString()}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CategoryFilter;
