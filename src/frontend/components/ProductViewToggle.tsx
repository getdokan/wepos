import React from 'react';
import { __ } from '@wordpress/i18n';
import { Grid3X3, List } from 'lucide-react';
import { ButtonToggleGroup, ToggleGroup, ToggleGroupItem } from '@wedevs/plugin-ui';
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
      <ButtonToggleGroup
        defaultValue="grid"
        items={[
          {
            label: '',
            startIcon: <Grid3X3 size={16} />,
            value: 'grid',
          },
          {
            label: '',
            startIcon: <List size={16} />,
            value: 'list',
          },
        ]}
        onChange={onToggle}
      />
    </div>
  );
};

export default ProductViewToggle;
