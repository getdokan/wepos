import React from 'react';
import { __ } from '@wordpress/i18n';
import { Plus } from 'lucide-react';
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
  return (
    <div
      className={
        productView === 'grid'
          ? 'grid h-[calc(100vh-200px)] grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 overflow-auto p-1 max-[360px]:grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] 2xl:grid-cols-[repeat(auto-fill,minmax(140px,1fr))] 2xl:gap-4'
          : 'h-[calc(100vh-200px)] overflow-auto p-1'
      }
      ref={itemsWrapperRef}
    >
      {!productLoading ? (
        <>
          {products.length > 0 ? (
            productView === 'list' ? (
              // Table-like compact list view
              <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="sticky top-0 z-10 grid grid-cols-12 gap-2 border-b border-gray-200 bg-gray-50 p-3 text-sm font-medium text-gray-700 max-[360px]:hidden sm:p-2 sm:text-xs">
                  <div className="col-span-1 flex items-center">
                    {__('Image', 'wepos')}
                  </div>
                  <div className="col-span-5 flex items-center max-[480px]:col-span-6">
                    {__('Product', 'wepos')}
                  </div>
                  <div className="col-span-2 flex items-center max-[768px]:hidden max-[480px]:col-span-1 max-[480px]:flex">
                    {__('SKU', 'wepos')}
                  </div>
                  <div className="col-span-2 flex items-center max-[768px]:col-span-3">
                    {__('Price', 'wepos')}
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    {__('Action', 'wepos')}
                  </div>
                </div>
                <div className="divide-y divide-gray-100 max-[360px]:space-y-2 max-[360px]:divide-y-0 max-[360px]:p-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={`grid cursor-pointer grid-cols-12 items-center gap-2 p-3 transition-colors hover:bg-gray-50 max-[360px]:mb-2 max-[360px]:block max-[360px]:rounded-lg max-[360px]:border max-[360px]:border-gray-200 max-[360px]:p-3 sm:gap-1 sm:p-2 sm:text-xs ${!hasStock(product) ? 'cursor-not-allowed opacity-50 hover:bg-transparent' : ''}`}
                    >
                      <div className="max-[360px]:col-span-auto col-span-1 flex items-center max-[360px]:mb-2">
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg border border-gray-200 object-cover max-[360px]:mx-auto max-[360px]:h-16 max-[360px]:w-16 sm:h-10 sm:w-10"
                        />
                      </div>
                      <div className="max-[360px]:col-span-auto col-span-5 flex items-center max-[480px]:col-span-6 max-[360px]:mb-2 max-[360px]:block">
                        <div className="font-medium text-gray-800">
                          {product.name}
                        </div>
                      </div>
                      <div className="max-[360px]:col-span-auto col-span-2 flex items-center max-[768px]:hidden max-[480px]:col-span-1 max-[480px]:flex max-[360px]:mb-2 max-[360px]:block">
                        <span className="text-sm text-gray-600 sm:text-xs">
                          {product.sku || '-'}
                        </span>
                      </div>
                      <div className="max-[360px]:col-span-auto col-span-2 flex items-center max-[768px]:col-span-3 max-[360px]:mb-2 max-[360px]:block">
                        <span
                          className="text-sm font-medium sm:text-xs"
                          dangerouslySetInnerHTML={{
                            __html: product.price_html,
                          }}
                        ></span>
                      </div>
                      <div className="max-[360px]:col-span-auto col-span-2 flex items-center justify-center max-[360px]:block">
                        {product.type === 'variable' && hasStock(product) ? (
                          <ProductVariationSelector
                            product={product}
                            onAddToCart={onAddToCartItem}
                          >
                            <button
                              className="bg-wepos-primary hover:bg-wepos-primary-hover focus:ring-wepos-primary/20 flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors focus:ring-2 focus:outline-none sm:h-7 sm:w-7"
                              title={__('Select variations', 'wepos')}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </ProductVariationSelector>
                        ) : hasStock(product) ? (
                          <button
                            onClick={() => onAddToCart(product)}
                            className="bg-wepos-primary hover:bg-wepos-primary-hover focus:ring-wepos-primary/20 flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors focus:ring-2 focus:outline-none sm:h-7 sm:w-7"
                            title={__('Add to cart', 'wepos')}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {__('Out of stock', 'wepos')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Fixed-width grid cards
              products.map((product) => (
                <div
                  key={product.id}
                  className="hover:border-wepos-primary/30 group min-w-40 min-h-40 cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg max-[360px]:mx-auto max-[360px]:max-w-[300px] max-[360px]:min-w-full sm:min-w-[140px] md:min-w-[150px] lg:min-w-[170px] xl:min-w-[150px] 2xl:min-w-[140px]"
                >
                  {product.type === 'variable' ? (
                    <ProductVariationSelector
                      product={product}
                      onAddToCart={onAddToCartItem}
                    >
                      <div
                        className={`relative transition-all duration-200 ${!hasStock(product) ? 'cursor-not-allowed opacity-50 hover:translate-y-0 hover:border-gray-200 hover:shadow-none' : ''}`}
                        title={
                          hasStock(product)
                            ? __('Select variations', 'wepos')
                            : __('Out of stock', 'wepos')
                        }
                      >
                        <div className="relative h-[120px] overflow-hidden max-[360px]:h-[120px] sm:h-[100px] md:h-[110px] lg:h-[130px] xl:h-[110px] 2xl:h-[100px]">
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                          {hasStock(product) && (
                            <div
                              className="bg-wepos-primary absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                              title={__('Select variations', 'wepos')}
                            >
                              <Plus className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-h-[80px] p-3 text-center max-[360px]:min-h-auto max-[360px]:p-3 sm:min-h-[70px] sm:p-2 md:min-h-[75px] md:p-2 lg:min-h-[80px] lg:p-3 xl:min-h-[75px] xl:p-2 2xl:min-h-[70px] 2xl:p-2">
                          <div className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm leading-tight font-medium text-gray-800 max-[360px]:mb-2 max-[360px]:line-clamp-2 max-[360px]:min-h-auto max-[360px]:text-sm sm:mb-1 sm:line-clamp-3 sm:min-h-[2.5rem] sm:text-xs md:mb-1 md:line-clamp-3 md:min-h-[2.5rem] md:text-xs lg:mb-2 lg:line-clamp-2 lg:min-h-[2.5rem] lg:text-sm xl:mb-1 xl:line-clamp-2 xl:min-h-[2rem] xl:text-xs 2xl:mb-1 2xl:line-clamp-2 2xl:min-h-[2rem] 2xl:text-xs">
                            {truncateTitle(product.name, 20)}
                          </div>
                          <div
                            className="text-wepos-primary text-sm font-semibold max-[360px]:text-sm sm:text-xs md:text-xs lg:text-sm xl:text-xs 2xl:text-xs"
                            dangerouslySetInnerHTML={{
                              __html: product.price_html,
                            }}
                          ></div>
                        </div>
                      </div>
                    </ProductVariationSelector>
                  ) : (
                    <div
                      className={`relative transition-all duration-200 ${!hasStock(product) ? 'cursor-not-allowed opacity-50 hover:translate-y-0 hover:border-gray-200 hover:shadow-none' : ''}`}
                      onClick={() => hasStock(product) && onAddToCart(product)}
                      title={
                        hasStock(product)
                          ? __('Add to cart', 'wepos')
                          : __('Out of stock', 'wepos')
                      }
                    >
                      <div className="relative h-[120px] overflow-hidden max-[360px]:h-[120px] sm:h-[100px] md:h-[110px] lg:h-[130px] xl:h-[110px] 2xl:h-[100px]">
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                        {hasStock(product) && (
                          <div
                            className="bg-wepos-primary absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                            title={__('Add to cart', 'wepos')}
                          >
                            <Plus className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-h-[80px] p-3 text-center max-[360px]:min-h-auto max-[360px]:p-3 sm:min-h-[70px] sm:p-2 md:min-h-[75px] md:p-2 lg:min-h-[80px] lg:p-3 xl:min-h-[75px] xl:p-2 2xl:min-h-[70px] 2xl:p-2">
                        <div className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm leading-tight font-medium text-gray-800 max-[360px]:mb-2 max-[360px]:line-clamp-2 max-[360px]:min-h-auto max-[360px]:text-sm sm:mb-1 sm:line-clamp-3 sm:min-h-[2.5rem] sm:text-xs md:mb-1 md:line-clamp-3 md:min-h-[2.5rem] md:text-xs lg:mb-2 lg:line-clamp-2 lg:min-h-[2.5rem] lg:text-sm xl:mb-1 xl:line-clamp-2 xl:min-h-[2rem] xl:text-xs 2xl:mb-1 2xl:line-clamp-2 2xl:min-h-[2rem] 2xl:text-xs">
                          {truncateTitle(product.name, 20)}
                        </div>
                        <div
                          className="text-wepos-primary text-sm font-semibold max-[360px]:text-sm sm:text-xs md:text-xs lg:text-sm xl:text-xs 2xl:text-xs"
                          dangerouslySetInnerHTML={{
                            __html: product.price_html,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )
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
          <div className="border-t-wepos-primary h-8 w-8 animate-spin rounded-full border-2 border-gray-300"></div>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
