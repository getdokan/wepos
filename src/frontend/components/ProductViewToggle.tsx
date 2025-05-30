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
    <div className="wepos-toggle-view">
      <div className="flex overflow-hidden rounded-lg border border-gray-300">
        <button
          className={`wepos-toggle-icon ${productView === 'grid' ? 'active' : ''} first:rounded-l-lg`}
          onClick={onToggle}
          type="button"
          title={__('Grid View', 'wepos')}
          aria-label={__('Switch to grid view', 'wepos')}
        >
          <Grid3X3 className="h-4 w-4" />
        </button>
        <button
          className={`wepos-toggle-icon ${productView === 'list' ? 'active' : ''} last:rounded-r-lg`}
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
