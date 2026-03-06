import React from 'react';
import { __ } from '@wordpress/i18n';
import { Plus, PackageX } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Spinner,
  Badge,
  Thumbnail,
  ScrollArea,
} from '@wedevs/plugin-ui';
import { formatPrice } from '../utils/helpers';
import { POSProduct, ProductViewType, CartItem } from '../types';
import ProductVariationSelector from './ProductVariationSelector';

interface ProductGridProps {
  products: POSProduct[];
  productView: ProductViewType;
  productLoading: boolean;
  onAddToCart: (product: POSProduct) => void;
  onAddToCartItem: (cartItem: CartItem) => void;
  formatPrice: (amount: number | string | undefined | null) => string;
  hasStock: (product: POSProduct) => boolean;
  getProductImage: (product: POSProduct) => string;
  truncateTitle: (text: string | undefined | null, length: number) => string;
  itemsWrapperRef: React.RefObject<HTMLDivElement>;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  productView,
  productLoading,
  onAddToCart,
  onAddToCartItem,
  formatPrice,
  hasStock,
  getProductImage,
  truncateTitle,
  itemsWrapperRef,
}) => {
  if (productLoading) {
    return (
      <div className="col-span-full flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="col-span-full py-20 text-center">
        <PackageX className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <p className="font-medium text-gray-500">
          {__('No Product Found', 'wepos')}
        </p>
      </div>
    );
  }

  const getStockQuantityLabel = (stock_quantity) => {
    if (stock_quantity === null) {
      return '';
    } else if (stock_quantity === 0) {
      return 'Empty';
    } else {
      return `${stock_quantity} Left`;
    }
  }

  return (
    <div className="h-full min-h-0 w-full flex-1 overflow-hidden" ref={itemsWrapperRef}>
      <ScrollArea className="h-full w-full pr-1.75">
        <div
          className={
            productView === 'grid'
              ? 'grid grid-cols-2 gap-4 p-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
              : 'p-1'
          }
        >
          {productView === 'list' ? (
            <div className="flex flex-col gap-3">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className={`flex flex-row items-center gap-4 p-3 shadow-none transition-all duration-200 hover:border-primary/50 hover:shadow-md ${!hasStock(product) ? 'opacity-50' : 'cursor-pointer'}`}
                  onClick={() =>
                    product.type !== 'variable' &&
                    hasStock(product) &&
                    onAddToCart(product)
                  }
                >
                  <Thumbnail
                    src={getProductImage(product)}
                    alt={product.name}
                    size={64}
                    className="rounded-lg border border-gray-100"
                  />
                  <div className="flex flex-1 flex-col justify-center text-left">
                    <div className="text-base font-bold text-gray-800">
                      {product.name}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
                      <span>
                        <span className="font-medium">{__('Sku :', 'wepos')}</span> {product.sku || '-'}
                      </span>
                      <span className="text-gray-200">|</span>
                      <span>
                        <span className="font-medium">{__('Price :', 'wepos')}</span>{' '}
                        <span
                          dangerouslySetInnerHTML={{
                            __html: product.price_html,
                          }}
                        />
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center px-2">
                    {product.type === 'variable' && hasStock(product) ? (
                      <ProductVariationSelector
                        product={product}
                        onAddToCart={onAddToCartItem}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-primary hover:bg-primary/5 hover:text-primary"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Plus className="h-7 w-7" />
                        </Button>
                      </ProductVariationSelector>
                    ) : hasStock(product) ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-primary hover:bg-primary/5 hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                      >
                        <Plus className="h-7 w-7" />
                      </Button>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="bg-transparent text-[10px] text-gray-400 border-gray-200!"
                      >
                        {__('Out of stock', 'wepos')}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            products.map((product) => {
              const inStock = hasStock(product);
              return (
                <Card
                  key={product.id}
                  className="group cursor-pointer border-gray-200 p-0 transition-all duration-200 hover:shadow-lg"
                >
                  <div className="relative w-full overflow-hidden rounded-t-xl bg-gray-100 pb-[100%]">
                    <Thumbnail
                      src={getProductImage(product)}
                      alt={product.name}
                      aspect="square"
                      size="custom"
                      className="absolute inset-0 h-full w-full rounded-none transition-transform duration-300"
                    />
                    {!inStock && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[2px] z-10">
                        <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-semibold border border-red-100 shadow-sm uppercase tracking-wide text-center">
                          Out of Stock
                        </span>
                      </div>
                    )}
                    {inStock && (
                      <div className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center opacity-100 sm:opacity-0 transition-opacity duration-200 sm:group-hover:opacity-100">
                        {product.type === 'variable' ? (
                          <ProductVariationSelector
                            product={product}
                            onAddToCart={onAddToCartItem}
                          >
                            <Button
                              variant="default"
                              size="icon-sm"
                              className="h-8 w-8 rounded-full shadow-md"
                            >
                              <Plus className="h-5 w-5" />
                            </Button>
                          </ProductVariationSelector>
                        ) : (
                          <Button
                            variant="default"
                            size="icon-sm"
                            className="h-8 w-8 rounded-full shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToCart(product);
                            }}
                          >
                            <Plus className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <CardContent className="flex flex-1 flex-col p-3 text-center">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 min-h-[40px]" title={product.name}>
                      {truncateTitle(product.name, 25)}
                    </h3>
                    <div className="flex items-center flex-wrap justify-center gap-2 mb-3">
                      <Badge className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-sm">
                        {product.categories[0].name}
                      </Badge>
                      <span className={`text-xs truncate ${!inStock ? "text-red-600 font-medium" : "text-gray-400"}`}>
                        {getStockQuantityLabel(product.stock_quantity)}
                      </span>
                    </div>

                    <div className="mt-auto flex items-end justify-between pt-3 border-t border-gray-50">
                      <div className="flex flex-col">
                        {product.regular_price && product.regular_price !== product.price && (
                          <span className="text-xs text-gray-400 line-through mb-0.5">
                            {formatPrice(product.regular_price)}
                          </span>
                        )}
                        <span className="text-sm font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProductGrid;
