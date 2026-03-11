import React from 'react';
import { __ } from '@wordpress/i18n';
import { Plus, ChevronDown } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Badge,
  Thumbnail,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@wedevs/plugin-ui';
import { POSProduct, CartItem } from '../types';
import { decodeHtmlEntities } from '../utils/helpers';
import ProductVariationSelector from './ProductVariationSelector';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductGridViewProps {
  products: POSProduct[];
  onAddToCart: (product: POSProduct) => void;
  onAddToCartItem: (cartItem: CartItem) => void;
  formatPrice: (amount: number | string | undefined | null) => string;
  hasStock: (product: POSProduct) => boolean;
  getProductImage: (product: POSProduct) => string;
  truncateTitle: (text: string | undefined | null, length: number) => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStockLabel(stock_quantity: number | null): string {
  if (stock_quantity === null) return '';
  if (stock_quantity === 0) return 'Empty';
  return `${stock_quantity} Left`;
}

// ─── Single grid card ─────────────────────────────────────────────────────────

interface ProductGridCardProps {
  product: POSProduct;
  onAddToCart: (product: POSProduct) => void;
  onAddToCartItem: (cartItem: CartItem) => void;
  formatPrice: (amount: number | string | undefined | null) => string;
  hasStock: boolean;
  getProductImage: (p: POSProduct) => string;
  truncateTitle: (text: string | undefined | null, length: number) => string;
}

const ProductGridCard: React.FC<ProductGridCardProps> = ({
  product,
  onAddToCart,
  onAddToCartItem,
  formatPrice,
  hasStock,
  getProductImage,
  truncateTitle,
}) => (
  <Card className="group cursor-pointer border-gray-200 p-0 transition-all duration-200 hover:shadow-lg">
    {/* Image */}
    <div className="relative w-full overflow-hidden rounded-t-xl bg-gray-100 pb-[100%]">
      <Thumbnail
        src={getProductImage(product)}
        alt={product.name}
        className="absolute inset-0 h-full w-full rounded-none transition-transform duration-300"
      />

      {!hasStock && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
          <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-center text-xs font-semibold uppercase tracking-wide text-red-600 shadow-sm">
            {__('Out of Stock', 'wepos')}
          </span>
        </div>
      )}

      {hasStock && (
        <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {product.type === 'variable' ? (
            <ProductVariationSelector product={product} onAddToCart={onAddToCartItem}>
              <Button variant="default" size="icon-sm" className="h-8 w-8 rounded-full shadow-md">
                <ChevronDown className="h-5 w-5" />
              </Button>
            </ProductVariationSelector>
          ) : (
            <Button
              variant="default"
              size="icon-sm"
              className="h-8 w-8 rounded-full shadow-md"
              onClick={(e: React.MouseEvent) => {
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

    {/* Content */}
    <CardContent className="flex flex-1 flex-col p-3 text-center">
      <h3
        className="mb-2 min-h-[40px] line-clamp-2 text-sm font-semibold text-gray-900"
        title={decodeHtmlEntities(product.name)}
      >
        {truncateTitle(decodeHtmlEntities(product.name), 25)}
      </h3>

      <div className="mb-3 flex w-full flex-col items-center gap-1.5">
        {/* Category row: badge + optional +N tooltip, constrained to card width */}
        <div className="flex w-full min-w-0 items-center justify-center gap-1">
          {(() => {
            const [first, ...extra] = product.categories ?? [];
            return (
              <>
                {first && (
                  <Badge
                    className="h-auto min-w-0 max-w-[calc(100%-2rem)] break-words whitespace-normal rounded-sm bg-gray-100 px-2 py-1 text-[10px] leading-tight font-semibold uppercase tracking-wider text-gray-500"
                    title={decodeHtmlEntities(first.name)}
                  >
                    {decodeHtmlEntities(first.name)}
                  </Badge>
                )}
                {extra.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="inline-flex shrink-0 cursor-default items-center rounded-sm border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 hover:bg-gray-100">
                        +{extra.length}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <div className="flex flex-wrap gap-1">
                        {extra.map((cat) => (
                          <span key={cat.id} className="whitespace-nowrap">
                            {decodeHtmlEntities(cat.name)}
                          </span>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </>
            );
          })()}
        </div>

        {/* Stock label */}
        <span
          className={`truncate text-xs ${
            !hasStock ? 'font-medium text-red-600' : 'text-gray-400'
          }`}
        >
          {getStockLabel(product.stock_quantity)}
        </span>
      </div>

      <div className="mt-auto flex items-end justify-between border-t border-gray-50 pt-3">
        <div className="flex flex-col">
          {product.type === 'variable' ? (
            <span
              className="text-sm font-bold text-gray-900"
              dangerouslySetInnerHTML={{ __html: product.price_html }}
            />
          ) : (
            <>
              {product.on_sale && product.regular_price && (
                <span className="mb-0.5 text-xs text-gray-400 line-through">
                  {formatPrice(product.regular_price)}
                </span>
              )}
              <span className="text-sm font-bold text-gray-900">
                {formatPrice(product.on_sale ? product.sale_price : product.regular_price)}
              </span>
            </>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

// ─── Main export ──────────────────────────────────────────────────────────────

export const ProductGridView: React.FC<ProductGridViewProps> = ({
  products,
  onAddToCart,
  onAddToCartItem,
  formatPrice,
  hasStock,
  getProductImage,
  truncateTitle,
}) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
    {products.map((product) => (
      <ProductGridCard
        key={product.id}
        product={product}
        onAddToCart={onAddToCart}
        onAddToCartItem={onAddToCartItem}
        formatPrice={formatPrice}
        hasStock={hasStock(product)}
        getProductImage={getProductImage}
        truncateTitle={truncateTitle}
      />
    ))}
  </div>
);

export default ProductGridView;
