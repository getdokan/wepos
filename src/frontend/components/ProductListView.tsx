import React from 'react';
import { __ } from '@wordpress/i18n';
import { ChevronRight, Plus } from 'lucide-react';
import {
  Badge,
  Button,
  Thumbnail,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@wedevs/plugin-ui';
import { POSProduct, CartItem } from '../types';
import { decodeHtmlEntities } from '../utils/helpers';
import ProductVariationSelector from './ProductVariationSelector';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductListViewProps {
  products: POSProduct[];
  onAddToCart: (product: POSProduct) => void;
  onAddToCartItem: (cartItem: CartItem) => void;
  formatPrice: (amount: number | string | undefined | null) => string;
  hasStock: (product: POSProduct) => boolean;
  getProductImage: (product: POSProduct) => string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────


function getVariablePriceRange(
  product: POSProduct,
  formatPrice: (amount: number | string | undefined | null) => string,
): string {
  const fallback = formatPrice(
    product.on_sale ? product.sale_price : product.regular_price,
  ) as string;

  const variations: any[] = product.variations ?? [];
  if (variations.length === 0) return fallback;

  const prices = variations
    .map((v) => parseFloat(v.price || v.regular_price || '0'))
    .filter((p) => !isNaN(p));

  if (prices.length === 0) return fallback;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max
    ? (formatPrice(min) as string)
    : `${formatPrice(min)} - ${formatPrice(max)}`;
}

// ─── Column layout ────────────────────────────────────────────────────────────
// grid-cols: [product] [type] [stock] [price] [action]

const ROW_GRID = 'grid grid-cols-[1fr_110px_80px_150px_60px] items-center gap-4 px-4';

// ─── Sub-components ───────────────────────────────────────────────────────────

const ListHeader: React.FC = () => (
  <div className={`${ROW_GRID} py-3 border-b border-gray-200 bg-gray-100 sticky top-0 z-10`}>
    <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
      {__('Product', 'wepos')}
    </span>
    <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 text-center">
      {__('Type', 'wepos')}
    </span>
    <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 text-center">
      {__('Stock', 'wepos')}
    </span>
    <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 text-right">
      {__('Price', 'wepos')}
    </span>
    <span />
  </div>
);

// ─── Product info cell (left column) ─────────────────────────────────────────

interface ProductInfoProps {
  product: POSProduct;
  getProductImage: (p: POSProduct) => string;
  formatPrice: (amount: number | string | undefined | null) => string;
  onAddToCartItem: (cartItem: CartItem) => void;
  hasStock: boolean;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  getProductImage,
  formatPrice,
  onAddToCartItem,
  hasStock,
}) => {
  const categories = product.categories ?? [];
  const [firstCategory, ...extraCategories] = categories;
  const variationAttributes = product.attributes?.filter((a) => a.variation) ?? [];

  return (
    <div className="flex items-start gap-3 min-w-0">
      <Thumbnail
        src={getProductImage(product)}
        alt={product.name}
        size={64}
        className="rounded-lg border border-gray-100 shrink-0"
      />

      <div className="flex flex-col gap-1 min-w-0">
        {/* Name */}
        <span className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">
          {decodeHtmlEntities(product.name)}
        </span>

        {/* Category badges — first always visible, extras shown on hover */}
        {firstCategory && (
          <div className="flex flex-wrap items-center gap-1">
            <Badge
              className="h-auto break-words whitespace-normal rounded-sm bg-gray-100 px-2 py-1 text-[10px] leading-tight font-semibold uppercase tracking-wider text-gray-500"
              title={decodeHtmlEntities(firstCategory.name)}
            >
              {decodeHtmlEntities(firstCategory.name)}
            </Badge>

            {extraCategories.length > 0 && (
              <Tooltip>
                <TooltipTrigger>
                  <span className="inline-flex cursor-default items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500 hover:bg-gray-100">
                    +{extraCategories.length}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="flex flex-wrap gap-1">
                    {extraCategories.map((cat) => (
                      <span key={cat.id} className="whitespace-nowrap">
                        {decodeHtmlEntities(cat.name)}
                      </span>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Variable product: list attribute options */}
        {product.type === 'variable' && variationAttributes.length > 0 && (
          <div className="flex flex-col gap-0.5 mt-0.5">
            {variationAttributes.map((attr) => (
              <span key={attr.name} className="text-xs text-gray-500 leading-relaxed">
                <span className="font-medium text-gray-600">{decodeHtmlEntities(attr.name)}:</span>{' '}
                {attr.options.map(decodeHtmlEntities).join(', ')}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Price cell ───────────────────────────────────────────────────────────────

interface PriceCellProps {
  product: POSProduct;
  formatPrice: (amount: number | string | undefined | null) => string;
}

const PriceCell: React.FC<PriceCellProps> = ({ product, formatPrice }) => {
  const hasRegularPrice =
    product.on_sale &&
    product.regular_price &&
    parseFloat(product.regular_price as string) > 0;

  const currentPrice =
    product.type === 'variable'
      ? getVariablePriceRange(product, formatPrice)
      : (formatPrice(product.on_sale ? product.sale_price : product.regular_price) as string);

  return (
    <div className="flex flex-col items-end gap-0.5">
      {hasRegularPrice && (
        <span className="text-xs text-gray-400 line-through">
          {formatPrice(product.regular_price)}
        </span>
      )}
      <span className="text-sm font-bold text-gray-900 leading-snug">
        {currentPrice}
      </span>
    </div>
  );
};

// ─── Action button ────────────────────────────────────────────────────────────

interface ActionButtonProps {
  product: POSProduct;
  hasStock: boolean;
  onAddToCart: (product: POSProduct) => void;
  onAddToCartItem: (cartItem: CartItem) => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  product,
  hasStock,
  onAddToCart,
  onAddToCartItem,
}) => {
  if (!hasStock) {
    return (
      <Button
        variant="default"
        size="icon"
        disabled
        className="h-10 w-10 rounded-full opacity-40 cursor-not-allowed"
        aria-label={__('Out of stock', 'wepos')}
      >
        <Plus className="h-5 w-5" />
      </Button>
    );
  }

  if (product.type === 'variable') {
    return (
      <ProductVariationSelector product={product} onAddToCart={onAddToCartItem}>
        <Button
          variant="default"
          size="icon"
          className="h-10 w-10 rounded-full shadow-sm"
          aria-label={__('Select variation', 'wepos')}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </ProductVariationSelector>
    );
  }

  return (
    <Button
      variant="default"
      size="icon"
      className="h-10 w-10 rounded-full shadow-sm"
      aria-label={__('Add to cart', 'wepos')}
      onClick={(e) => {
        e.stopPropagation();
        onAddToCart(product);
      }}
    >
      <Plus className="h-5 w-5" />
    </Button>
  );
};

// ─── Single list row ──────────────────────────────────────────────────────────

interface ProductListRowProps {
  product: POSProduct;
  onAddToCart: (product: POSProduct) => void;
  onAddToCartItem: (cartItem: CartItem) => void;
  formatPrice: (amount: number | string | undefined | null) => string;
  hasStock: boolean;
  getProductImage: (p: POSProduct) => string;
}

const ProductListRow: React.FC<ProductListRowProps> = ({
  product,
  onAddToCart,
  onAddToCartItem,
  formatPrice,
  hasStock,
  getProductImage,
}) => (
  <div
    className={`${ROW_GRID} py-4 border-b border-gray-100 transition-colors hover:bg-gray-50/50 ${
      !hasStock ? 'opacity-60' : ''
    }`}
  >
    {/* Product info */}
    <ProductInfo
      product={product}
      getProductImage={getProductImage}
      formatPrice={formatPrice}
      onAddToCartItem={onAddToCartItem}
      hasStock={hasStock}
    />

    {/* Type */}
    <div className="text-center">
      <span className="text-sm text-gray-600 capitalize">
        {product.type === 'variable' ? __('Variable', 'wepos') : __('Simple', 'wepos')}
      </span>
    </div>

    {/* Stock */}
    <div className="text-center">
      <span
        className={`text-sm font-medium ${
          (product.stock_quantity ?? 0) === 0 && product.manage_stock
            ? 'text-red-500'
            : 'text-gray-700'
        }`}
      >
        {product.manage_stock ? (product.stock_quantity ?? 0) : '-'}
      </span>
    </div>

    {/* Price */}
    <PriceCell product={product} formatPrice={formatPrice} />

    {/* Action */}
    <div className="flex justify-end">
      <ActionButton
        product={product}
        hasStock={hasStock}
        onAddToCart={onAddToCart}
        onAddToCartItem={onAddToCartItem}
      />
    </div>
  </div>
);

// ─── Main export ──────────────────────────────────────────────────────────────

export const ProductListView: React.FC<ProductListViewProps> = ({
  products,
  onAddToCart,
  onAddToCartItem,
  formatPrice,
  hasStock,
  getProductImage,
}) => (
  <div className="overflow-hidden border-b border-gray-200 bg-white">
    <ListHeader />
    <div className="divide-y divide-gray-100">
      {products.map((product) => (
        <ProductListRow
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onAddToCartItem={onAddToCartItem}
          formatPrice={formatPrice}
          hasStock={hasStock(product)}
          getProductImage={getProductImage}
        />
      ))}
    </div>
  </div>
);

export default ProductListView;
