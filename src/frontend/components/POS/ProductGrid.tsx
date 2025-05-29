import React from 'react';
import { POSProduct, ProductViewType } from '../../types';

interface ProductGridProps {
  products: POSProduct[];
  productView: ProductViewType;
  productLoading: boolean;
  onAddToCart: (product: POSProduct) => void;
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
  formatPrice,
  hasStock,
  getProductImage,
  truncateTitle,
  itemsWrapperRef,
}) => {
  return (
    <div className={`items-wrapper ${productView}`} ref={itemsWrapperRef}>
      {!productLoading ? (
        <>
          {products.length > 0 ? (
            products.map((product) => (
              <div key={product.id} className="item">
                {product.type === 'simple' && (
                  <div
                    className={`item-wrap ${!hasStock(product) ? 'disabled' : ''}`}
                    onClick={() => onAddToCart(product)}
                  >
                    <div className="img">
                      <img src={getProductImage(product)} alt={product.name} />
                    </div>
                    <div className="title">
                      {productView === 'grid' ? (
                        truncateTitle(product.name, 20)
                      ) : (
                        <div>
                          <div className="product-name">{product.name}</div>
                          <ul className="meta">
                            {product.sku && (
                              <li>
                                <span className="label">SKU:</span>
                                <span className="value">{product.sku}</span>
                              </li>
                            )}
                            <li>
                              <span className="label">Price:</span>
                              <span
                                className="value"
                                dangerouslySetInnerHTML={{ __html: product.price_html }}
                              ></span>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                    <span className={`add-product-icon flaticon-add ${productView}`}></span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-product-found">
              <img
                src={`${(window as any).wepos?.assets_url}/images/no-product.png`}
                alt=""
                width="120px"
              />
              <p>No Product Found</p>
            </div>
          )}
        </>
      ) : (
        <div className="product-loading">
          <div className="spinner spinner-loading"></div>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
