import React from 'react';
import { ProductViewType } from '../../types';

interface ProductViewToggleProps {
  productView: ProductViewType;
  onToggle: () => void;
}

const ProductViewToggle: React.FC<ProductViewToggleProps> = ({
  productView,
  onToggle,
}) => {
  return (
    <div className="toggle-view">
      <div className="product-toggle">
        <span
          className={`toggle-icon list-view flaticon-menu-button-of-three-horizontal-lines ${productView === 'list' ? 'active' : ''}`}
          onClick={onToggle}
        ></span>
        <span
          className={`toggle-icon grid-view flaticon-menu ${productView === 'grid' ? 'active' : ''}`}
          onClick={onToggle}
        ></span>
      </div>
    </div>
  );
};

export default ProductViewToggle;
