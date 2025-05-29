import React from 'react';
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
      <div className="flex rounded-sm overflow-hidden border border-wepos-border">
        <button
          className={`wepos-toggle-icon border-r border-wepos-border ${productView === 'list' ? 'active' : ''}`}
          onClick={onToggle}
          title="List View"
          type="button"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          className={`wepos-toggle-icon ${productView === 'grid' ? 'active' : ''}`}
          onClick={onToggle}
          title="Grid View"
          type="button"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ProductViewToggle;
