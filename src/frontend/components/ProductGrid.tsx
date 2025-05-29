import React from 'react';
import { __ } from '@wordpress/i18n';
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
  truncateTitle: (text: string, length: number) => string;
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
  return (
    <div
      className={productView === 'grid' ? 'wepos-items-grid' : 'wepos-items-list'}
      ref={itemsWrapperRef}
    >
      {!productLoading ? (
        <>
          {products.length > 0 ? (
            products.map((product) => (
              <div
                key={product.id}
                className={productView === 'grid' ? 'wepos-item-grid' : 'wepos-item-list'}
              >
                {product.type === 'simple' && (
                  <div
                    className={`relative cursor-pointer transition-all duration-200 ${!hasStock(product) ? 'wepos-item-disabled' : ''}`}
                    onClick={() => onAddToCart(product)}
                    title={hasStock(product) ? __('Add to cart', 'wepos') : __('Out of stock', 'wepos')}
                  >
                    <div className={productView === 'grid' ? 'mb-3' : 'flex gap-4'}>
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className={`wepos-item-image ${productView === 'list' ? 'shrink-0' : ''}`}
                      />
                      {productView === 'grid' && hasStock(product) && (
                        <div className="wepos-add-icon" title={__('Add to cart', 'wepos')}>
                          +
                        </div>
                      )}
                    </div>
                    <div className={`text-sm ${productView === 'list' ? 'flex-1' : ''}`}>
                      {productView === 'grid' ? (
                        <div className="font-medium text-gray-800 text-center">
                          {truncateTitle(product.name, 20)}
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 mb-1">{product.name}</div>
                            <div className="text-xs text-gray-600 space-y-1">
                              {product.sku && (
                                <div>
                                  <span className="font-medium">{__('SKU:', 'wepos')}</span>
                                  <span className="ml-1">{product.sku}</span>
                                </div>
                              )}
                              <div>
                                <span className="font-medium">{__('Price:', 'wepos')}</span>
                                <span
                                  className="ml-1"
                                  dangerouslySetInnerHTML={{ __html: product.price_html }}
                                ></span>
                              </div>
                            </div>
                          </div>
                          {hasStock(product) && (
                            <div className="ml-4 w-8 h-8 bg-wepos-primary text-white rounded-full flex items-center justify-center text-lg font-bold" title={__('Add to cart', 'wepos')}>
                              +
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {product.type === 'variable' && (
                  <ProductVariationSelector
                    product={product}
                    onAddToCart={onAddToCartItem}
                  >
                    <div
                      className={`relative cursor-pointer transition-all duration-200 ${!hasStock(product) ? 'wepos-item-disabled' : ''}`}
                      title={hasStock(product) ? __('Select variations', 'wepos') : __('Out of stock', 'wepos')}
                    >
                      <div className={productView === 'grid' ? 'mb-3' : 'flex gap-4'}>
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className={`wepos-item-image ${productView === 'list' ? 'shrink-0' : ''}`}
                        />
                        {productView === 'grid' && hasStock(product) && (
                          <div className="wepos-add-icon" title={__('Select variations', 'wepos')}>
                            +
                          </div>
                        )}
                      </div>
                      <div className={`text-sm ${productView === 'list' ? 'flex-1' : ''}`}>
                        {productView === 'grid' ? (
                          <div className="font-medium text-gray-800 text-center">
                            {truncateTitle(product.name, 20)}
                          </div>
                        ) : (
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-800 mb-1">{product.name}</div>
                              <div className="text-xs text-gray-600 space-y-1">
                                {product.sku && (
                                  <div>
                                    <span className="font-medium">{__('SKU:', 'wepos')}</span>
                                    <span className="ml-1">{product.sku}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium">{__('Price:', 'wepos')}</span>
                                  <span
                                    className="ml-1"
                                    dangerouslySetInnerHTML={{ __html: product.price_html }}
                                  ></span>
                                </div>
                              </div>
                            </div>
                            {hasStock(product) && (
                              <div className="ml-4 w-8 h-8 bg-wepos-primary text-white rounded-full flex items-center justify-center text-lg font-bold" title={__('Select variations', 'wepos')}>
                                +
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </ProductVariationSelector>
                )}
              </div>
            ))
          ) : (
            <div className="wepos-no-product-found">
              <img
                src={`${(window as any).wepos?.assets_url}/images/no-product.png`}
                alt={__('No products found', 'wepos')}
                width="120px"
                className="mx-auto mb-4"
              />
              <p>{__('No Product Found', 'wepos')}</p>
            </div>
          )}
        </>
      ) : (
        <div className="wepos-product-loading">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-wepos-primary"></div>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
