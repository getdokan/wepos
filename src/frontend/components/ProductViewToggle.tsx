import React from 'react';
import { __ } from '@wordpress/i18n';
import { Grid2x2, LayoutList } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, cn } from '@wedevs/plugin-ui';
import { ProductViewType } from '../types';

interface ProductViewToggleProps {
  productView: ProductViewType;
  onToggle: (view: ProductViewType) => void;
}

const ProductViewToggle: React.FC<ProductViewToggleProps> = ({
  productView,
  onToggle,
}) => {
  return (
    <div className="shrink-0">
      <Tabs
        value={productView}
        onValueChange={(value) => onToggle(value as ProductViewType)}
        className="w-auto"
      >
        <TabsList className="grid grid-cols-2 border border-border">
          <TabsTrigger value="grid" className="p-1.5">
            <Grid2x2
              size={16}
              className={cn(productView === 'grid' ? "text-primary" : "text-gray-500")}
            />
          </TabsTrigger>
          <TabsTrigger value="list" className="p-1.5">
            <LayoutList
              size={16}
              className={cn(productView === 'list' ? "text-primary" : "text-gray-500")}
            />
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default ProductViewToggle;
