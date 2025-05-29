import React from 'react';
import { __ } from '@wordpress/i18n';
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
      <div className="flex border border-gray-300 rounded-lg overflow-hidden">
        <button
          className={`wepos-toggle-icon ${productView === 'grid' ? 'active' : ''} first:rounded-l-lg`}
          onClick={onToggle}
          type="button"
          title={__('Grid View', 'wepos')}
          aria-label={__('Switch to grid view', 'wepos')}
        >
          ⊞
        </button>
        <button
          className={`wepos-toggle-icon ${productView === 'list' ? 'active' : ''} last:rounded-r-lg`}
          onClick={onToggle}
          type="button"
          title={__('List View', 'wepos')}
          aria-label={__('Switch to list view', 'wepos')}
        >
          ☰
        </button>
      </div>
    </div>
  );
};

export default ProductViewToggle;
