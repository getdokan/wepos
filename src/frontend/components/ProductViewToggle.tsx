import React from 'react';
import { __ } from '@wordpress/i18n';
import { Grid3X3, List } from 'lucide-react';
import { ProductViewType } from '../types';

interface ProductViewToggleProps {
  productView: ProductViewType;
  onToggle: () => void;
}

const ProductViewToggle: React.FC<ProductViewToggleProps> = ({
  productView,
  onToggle,
}) => {
  return (
    <div className="shrink-0">
      <div className="flex overflow-hidden rounded-lg border border-gray-300">
        <button
          className={`cursor-pointer border border-gray-300 bg-white px-3 py-2 text-gray-500 transition-all duration-200 select-none first:rounded-l-lg hover:bg-gray-50 ${productView === 'grid' ? 'text-wepos-primary bg-wepos-primary/5 border-wepos-primary' : ''}`}
          onClick={onToggle}
          type="button"
          title={__('Grid View', 'wepos')}
          aria-label={__('Switch to grid view', 'wepos')}
        >
          <Grid3X3 className="h-4 w-4" />
        </button>
        <button
          className={`cursor-pointer border border-gray-300 bg-white px-3 py-2 text-gray-500 transition-all duration-200 select-none last:rounded-r-lg hover:bg-gray-50 ${productView === 'list' ? 'text-wepos-primary bg-wepos-primary/5 border-wepos-primary' : ''}`}
          onClick={onToggle}
          type="button"
          title={__('List View', 'wepos')}
          aria-label={__('Switch to list view', 'wepos')}
        >
          <List className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ProductViewToggle;
