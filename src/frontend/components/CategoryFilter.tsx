import React from 'react';
import { POSCategory } from '../types';

interface CategoryFilterProps {
  categories: POSCategory[];
  selectedCategory: POSCategory | null;
  onCategoryChange: (category: POSCategory) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <div className="wepos-category">
      <select
        id="product-category"
        className="wepos-select"
        value={selectedCategory?.id || -1}
        onChange={(e) => {
          const categoryId = parseInt(e.target.value);
          const category = categories.find(cat => cat.id === categoryId);
          if (category) {
            onCategoryChange(category);
          }
        }}
      >
        {categories.map(category => (
          <option key={category.id} value={category.id}>
            {'  '.repeat(category.level)}{category.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CategoryFilter;
