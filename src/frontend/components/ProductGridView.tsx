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
import {
  decodeHtmlEntities,
  pickRegularDisplayPrice,
  pickSaleDisplayPrice,
} from '../utils/helpers';
import ProductVariationSelector from './ProductVariationSelector';

// Cart-display price — matches whatever the cart row will render so the cashier
// sees the same number on both surfaces, regardless of
// `prices_include_tax` × `tax_display_cart`.
function getDisplayPrice(product: POSProduct): number {
  return product.on_sale
    ? pickSaleDisplayPrice(product)
    : pickRegularDisplayPrice(product);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getVariablePriceRange(
  product: POSProduct,
  formatPrice: (amount: number | string | undefined | null) => string,
): string {
  const fallback = formatPrice(getDisplayPrice(product)) as string;

  const variations: any[] = product.variations ?? [];
  if (variations.length === 0) return fallback;

  const prices = variations
    .map((v) => (v.on_sale ? pickSaleDisplayPrice(v) : pickRegularDisplayPrice(v)))
    .filter((p) => p > 0);

  if (prices.length === 0) return fallback;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max
    ? (formatPrice(min) as string)
    : `${formatPrice(min)} \u2013 ${formatPrice(max)}`;
}

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
}) => {
  const isVariable = product.type === 'variable';

  const cardContent = (
    <Card
      className={`group border-border p-0 transition-all duration-200 hover:shadow-lg ${
        hasStock ? 'cursor-pointer' : 'cursor-not-allowed'
      }`}
      onClick={
        hasStock && !isVariable
          ? () => {
              onAddToCart(product);
            }
          : undefined
      }
    >
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden rounded-t-xl bg-muted">
        <Thumbnail
          src={getProductImage(product)}
          alt={product.name}
          className="h-full w-full rounded-none object-cover transition-transform duration-300"
        />

        {!hasStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
            <span className="rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-center text-xs font-semibold uppercase tracking-wide text-destructive shadow-sm">
              {__('Out of Stock', 'wepos')}
            </span>
          </div>
        )}

        {hasStock && (
          <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center opacity-100 lg:opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {isVariable ? (
              <Button variant="default" size="icon-sm" className="h-8 w-8 rounded-full shadow-md">
                <ChevronDown className="h-5 w-5" />
              </Button>
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
      <CardContent className="flex flex-1 flex-col p-3">
        <h3
          className="mb-2 min-h-[40px] line-clamp-2 text-sm font-semibold text-foreground"
          title={decodeHtmlEntities(product.name)}
        >
          {truncateTitle(decodeHtmlEntities(product.name), 25)}
        </h3>

        <div className="mb-3 flex w-full min-w-0 flex-wrap items-center gap-1">
          {/* Category badge + stock label on same row */}
          {(() => {
            const [first, ...extra] = product.categories ?? [];
            return (
              <>
                {first && (
                  <Badge
                    className="h-auto min-w-0 max-w-[calc(100%-2rem)] break-words whitespace-normal rounded-sm bg-muted px-2 py-1 text-[10px] leading-tight font-semibold uppercase tracking-wider text-muted-foreground"
                    title={decodeHtmlEntities(first.name)}
                  >
                    {decodeHtmlEntities(first.name)}
                  </Badge>
                )}
                {extra.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="inline-flex shrink-0 cursor-default items-center rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground hover:bg-accent">
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

          {/* Stock label */}
          {product.stock_quantity !== null && (
            <span
              className={`text-xs ${
                !hasStock || product.stock_quantity === 0 ? 'font-medium text-destructive' : 'text-muted-foreground'
              }`}
            >
              {getStockLabel(product.stock_quantity)}
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-col">
          {isVariable ? (
            <span className="text-sm font-bold text-foreground">
              {getVariablePriceRange(product, formatPrice)}
            </span>
          ) : (
            <>
              {product.on_sale && product.regular_price && (
                <span className="mb-0.5 text-xs text-muted-foreground line-through">
                  {formatPrice(pickRegularDisplayPrice(product))}
                </span>
              )}
              <span className="text-sm font-bold text-foreground">
                {formatPrice(getDisplayPrice(product))}
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (hasStock && isVariable) {
    return (
      <ProductVariationSelector product={product} onAddToCart={onAddToCartItem}>
        {cardContent}
      </ProductVariationSelector>
    );
  }

  return cardContent;
};

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
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
