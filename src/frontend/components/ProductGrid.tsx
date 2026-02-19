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

  return (
    <div className="h-full min-h-0 w-full flex-1 overflow-hidden" ref={itemsWrapperRef}>
      <ScrollArea className="h-full w-full">
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
                  className={`group cursor-pointer border-gray-200 p-0 transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg ${!inStock ? 'opacity-50' : ''}`}
                  onClick={() =>
                    product.type !== 'variable' &&
                    inStock &&
                    onAddToCart(product)
                  }
                >
                  <div className="relative w-full overflow-hidden rounded-t-xl bg-gray-100 pb-[100%]">
                    <Thumbnail
                      src={getProductImage(product)}
                      alt={product.name}
                      aspect="square"
                      size="custom"
                      className="absolute inset-0 h-full w-full rounded-none transition-transform duration-300 group-hover:scale-105"
                    />
                    {inStock && (
                      <div className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        {product.type === 'variable' ? (
                          <ProductVariationSelector
                            product={product}
                            onAddToCart={onAddToCartItem}
                          >
                            <Button
                              variant="default"
                              size="icon-sm"
                              className="h-8 w-8 rounded-full shadow-md"
                              onClick={(e) => e.stopPropagation()}
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
                    <div className="mb-1 line-clamp-2 min-h-[2.5rem] text-sm font-medium text-gray-800">
                      {truncateTitle(product.name, 25)}
                    </div>
                    <div
                      className="mt-auto text-sm font-bold text-primary"
                      dangerouslySetInnerHTML={{
                        __html: product.price_html,
                      }}
                    ></div>
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
