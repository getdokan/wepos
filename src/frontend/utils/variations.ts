import { CartItem, POSProduct, ProductVariation } from '../types';
import {
  firstPresentNumber,
  pickRegularDisplayPrice,
  pickSaleDisplayPrice,
  toFiniteNumber,
} from './helpers';

export type SelectedAttributes = Record<string, string>;

/**
 * Attributes the shopper must pick before a variation can be resolved.
 * A variable product may also carry display-only attributes (variation: false);
 * those are never rendered and must not count toward "all attributes selected".
 */
export const getVariationAttributes = (product: POSProduct) =>
  (product.attributes || []).filter((attribute) => attribute.variation);

/**
 * True once every variation attribute has a chosen option.
 */
export const areAllVariationAttributesSelected = (
  product: POSProduct,
  selected: SelectedAttributes,
): boolean => {
  const required = getVariationAttributes(product);

  if (required.length === 0) return false;

  return required.every((attribute) => !!selected[attribute.name]);
};

/**
 * Resolve the variation matching the chosen attributes.
 *
 * Walk the *variation's* attributes, not the chosen ones: WooCommerce omits (or
 * sends an empty option for) attributes set to "Any", so a variation legitimately
 * carries fewer attributes than the parent declares. Requiring every chosen
 * attribute to exist on the variation never matches those products.
 *
 * Exact matches win over "Any" wildcards, mirroring WC_Data_Store_WP::find_matching_product_variation.
 */
export const findMatchingVariation = (
  product: POSProduct,
  selected: SelectedAttributes,
): ProductVariation | null => {
  const variations = (product.variations || []) as ProductVariation[];

  if (variations.length === 0) return null;

  const candidates = variations.filter((variation) =>
    (variation.attributes || []).every(
      // Empty option means "Any" — matches whatever the shopper chose.
      (attribute) => !attribute.option || selected[attribute.name] === attribute.option,
    ),
  );

  if (candidates.length === 0) return null;

  const specificity = (variation: ProductVariation) =>
    (variation.attributes || []).filter((attribute) => !!attribute.option).length;

  return candidates.reduce((best, variation) =>
    specificity(variation) > specificity(best) ? variation : best,
  );
};

/**
 * Build the cart line for a resolved variation.
 *
 * Variations must go through this and never through the simple-product path:
 * the line needs product_id = parent and variation_id = variation, otherwise the
 * order sync can't match its own lines and the cart row loses its attribute labels.
 */
export const buildVariationCartItem = (
  product: POSProduct,
  variation: ProductVariation,
  selected: SelectedAttributes,
): CartItem => {
  // Label the cart row with what the variation constrains, falling back to the
  // cashier's pick for "Any" attributes. Barcode lookups pass no separate
  // selection, so they end up with the variation's own attributes.
  const constrained = new Map(
    (variation.attributes || [])
      .filter((attribute) => !!attribute.option)
      .map((attribute) => [attribute.name, { id: attribute.id ?? 0, option: attribute.option }]),
  );

  const names: string[] = [];
  const pushName = (name: string) => {
    if (!names.includes(name)) names.push(name);
  };

  // Parent order first so the row reads the same as the variation picker.
  getVariationAttributes(product).forEach((attribute) => pushName(attribute.name));
  (variation.attributes || []).forEach((attribute) => pushName(attribute.name));
  Object.keys(selected).forEach(pushName);

  const variationAttributes = names
    .map((name) => ({
      id: constrained.get(name)?.id ?? 0,
      name,
      option: constrained.get(name)?.option || selected[name] || '',
    }))
    .filter((attribute) => !!attribute.option);

  return {
    id: Date.now(),
    product_id: product.id,
    variation_id: variation.id,
    name: product.name,
    sku: variation.sku || product.sku || '',
    quantity: 1,
    regular_price: pickRegularDisplayPrice(variation),
    sale_price: pickSaleDisplayPrice(variation),
    raw_regular_price: toFiniteNumber(variation.regular_price),
    raw_sale_price: toFiniteNumber(variation.sale_price),
    on_sale: variation.on_sale,
    type: 'variable',
    attribute: variationAttributes,
    editQuantity: false,
    tax_amount: firstPresentNumber(variation.tax_amount, product.tax_amount) ?? 0,
    manage_stock: variation.manage_stock,
    stock_status: variation.stock_status,
    backorders_allowed: variation.backorders_allowed,
    stock_quantity: variation.stock_quantity ?? undefined,
    sold_individually: product.sold_individually,
  };
};
