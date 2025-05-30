import React from 'react';
import { __ } from '@wordpress/i18n';
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
    <div className="w-64 w-full md:w-64">
      <select
        className="focus:ring-wepos-primary/20 focus:border-wepos-primary h-10 w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 transition-colors focus:ring-2"
        value={selectedCategory?.id || ''}
        onChange={(e) => {
          const categoryId = e.target.value;
          if (categoryId === '') {
            onCategoryChange(null);
          } else {
            const category =
              categories.find((cat) => cat.id.toString() === categoryId) ||
              null;
            onCategoryChange(category);
          }
        }}
      >
        <option value="">{__('All Categories', 'wepos')}</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {'  '.repeat(category.level)}
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CategoryFilter;
