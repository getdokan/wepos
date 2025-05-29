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
    <div className="wepos-category">
      <select
        className="wepos-select"
        value={selectedCategory?.id || ''}
        onChange={(e) => {
          const categoryId = e.target.value;
          const category = categories.find(cat => cat.id.toString() === categoryId) || null;
          onCategoryChange(category);
        }}
      >
        <option value="">{__('All Categories', 'wepos')}</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {'  '.repeat(category.level)}{category.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CategoryFilter;
