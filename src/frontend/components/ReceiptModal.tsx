import React, { useEffect } from 'react';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { POSPrintData, POSSettings } from '../types';
import { Check, Plus, Printer } from 'lucide-react';
import { applyFilters } from '../hooks/useExtensions';

interface ReceiptModalProps {
  show: boolean;
  printdata: POSPrintData;
  selectedGateway: string;
  settings: POSSettings;
  onClose: () => void;
  onNewSale: () => void;
  formatPrice: (amount: number | string | undefined | null) => string;
}

/**
 * Print styles injected into the document head.
 * Matches the Vue receiptHtml.vue @media print approach:
 * hides everything on the page, shows only the receipt wrapper.
 */
const PRINT_STYLES = `
@media print {
  @page { margin: 0.5cm; }

  /* Hide everything on the page */
  body * {
    visibility: hidden !important;
  }

  /* Show only the print container */
  #wepos-receipt-print-container {
    display: block !important;
    visibility: visible !important;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: white;
  }
  #wepos-receipt-print-container * {
    visibility: visible !important;
  }

  /* ─── Receipt layout styles ─── */
  .wepos-checkout-print-wrapper {
    box-sizing: border-box;
    font-family: Helvetica, Verdana, Calibri, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    color: #000;
    padding: 10px;
  }
  .wepos-checkout-print-wrapper p { margin: 5px 0; }

  /* Header & Footer */
  .wepos-checkout-print-wrapper .header,
  .wepos-checkout-print-wrapper .footer { padding: 5px; text-align: center; }
  .wepos-checkout-print-wrapper .footer { margin-top: 15px; }

  /* Logo */
  .wepos-checkout-print-wrapper .header .logo { text-align: center; margin-bottom: 8px; }

  /* Outlet info (pro) */
  .wepos-checkout-print-wrapper .header .outlet-info { margin: 8px 0; text-align: center; }
  .wepos-checkout-print-wrapper .header .outlet-info h3 { margin: 0 0 10px; }
  .wepos-checkout-print-wrapper .header .outlet-info p { margin: 3px; padding: 0; }
  .wepos-checkout-print-wrapper .header .outlet-info p.address { width: 200px; margin: 5px auto; }

  /* Cashier info (pro) */
  .wepos-checkout-print-wrapper .header .cashier-info { margin: 10px 0; }

  /* Order info (base – no .header parent) */
  .wepos-checkout-print-wrapper > .order-info {
    margin: 10px 0;
    border-bottom: 1px dashed #b7b7b7;
    padding: 10px 5px;
    display: flex;
    justify-content: space-between;
  }

  /* Order info (pro – inside .header, stacked & centered) */
  .wepos-checkout-print-wrapper .header .order-info {
    display: block;
    border: none;
    margin: 10px 0;
    padding: 0;
  }

  /* Customer info (pro) */
  .wepos-checkout-print-wrapper .header .customer-info { border: none; margin: 10px 0; }
  .wepos-checkout-print-wrapper .header .vat-tax-info { margin: 5px 0; }
  .wepos-checkout-print-wrapper .header .order-note-info { margin: 5px 0; }

  /* Content */
  .wepos-checkout-print-wrapper .content { padding: 10px; }

  /* Sale summary table */
  .wepos-checkout-print-wrapper table.sale-summary { width: 100%; border-collapse: collapse; }
  .wepos-checkout-print-wrapper table.sale-summary thead tr.item-header { border-bottom: 1px dashed #b7b7b7; }
  .wepos-checkout-print-wrapper table.sale-summary thead th { padding: 10px 0; }
  .wepos-checkout-print-wrapper table.sale-summary thead th:first-child { text-align: left; }
  .wepos-checkout-print-wrapper table.sale-summary thead th:last-child { text-align: right; }
  .wepos-checkout-print-wrapper table.sale-summary td { font-size: 14px; padding: 6px 0; }
  .wepos-checkout-print-wrapper table.sale-summary td.name { width: 45%; text-align: left; }
  .wepos-checkout-print-wrapper table.sale-summary td.name .tax-info { display: block; font-size: 13px; font-weight: 400; }
  .wepos-checkout-print-wrapper table.sale-summary td.name .metadata { margin-left: 6px; color: #758598; font-size: 12px; font-weight: normal; }
  .wepos-checkout-print-wrapper table.sale-summary td.quantity { width: 12%; }
  .wepos-checkout-print-wrapper table.sale-summary td.price { text-align: right; }
  .wepos-checkout-print-wrapper table.sale-summary td.price .regular-price { font-size: 12px; text-decoration: line-through; color: #9095A5; padding-right: 3px; }
  .wepos-checkout-print-wrapper table.sale-summary .attribute ul { margin: 0; padding: 0; list-style: none; }
  .wepos-checkout-print-wrapper table.sale-summary .attribute li { display: inline-block; margin-right: 5px; font-size: 12px; font-weight: normal; }
  .wepos-checkout-print-wrapper table.sale-summary .attribute .attr_name { color: #758598; }

  /* Payment detail rows (pro) */
  .wepos-checkout-print-wrapper tr.payment-details td.name { text-align: left; }
  .wepos-checkout-print-wrapper tr.payment-details td.price { text-align: right; }

  /* Divider rows */
  .wepos-checkout-print-wrapper tr.divider { border-bottom: 1px dashed #b7b7b7; color: #b5b5b5; }
  .wepos-checkout-print-wrapper tr.divider td { padding: 5px 0; }

  /* Float helpers */
  .wepos-clearfix { clear: both; }
  .wepos-left { float: left; }
  .wepos-right { float: right; }
}

/* Always hidden on screen */
#wepos-receipt-print-container { display: none; }
`;

const ReceiptModal: React.FC<ReceiptModalProps> = ({
  show,
  printdata,
  selectedGateway,
  settings,
  onClose,
  onNewSale,
  formatPrice,
}) => {
  // Inject print styles into document head (once, cleaned up on unmount)
  useEffect(() => {
    if (document.getElementById('wepos-receipt-print-styles')) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'wepos-receipt-print-styles';
    styleEl.textContent = PRINT_STYLES;
    document.head.appendChild(styleEl);

    return () => {
      const el = document.getElementById('wepos-receipt-print-styles');
      if (el) el.remove();
    };
  }, []);

  if (!show) return null;

  /**
   * Print on the same page (like Vue).
   * Clones the receipt HTML to a body-level container, then calls window.print().
   * The @media print CSS hides everything except #wepos-receipt-print-container.
   */
  const handlePrint = () => {
    const receiptEl = document.getElementById('wepos-print-receipt');
    if (!receiptEl) return;

    // Clone receipt HTML into a body-level container
    // (needed because the receipt is inside the WP modal portal)
    let container = document.getElementById('wepos-receipt-print-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'wepos-receipt-print-container';
      document.body.appendChild(container);
    }
    container.innerHTML = receiptEl.innerHTML;

    // Small delay to ensure DOM is ready, matching Vue behavior
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleNewSale = () => {
    onNewSale();
    onClose();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const isTaxInclusive = settings?.woo_tax?.wc_tax_display_cart === 'incl';
  const isFeeTaxEnabled = settings?.wepos_general?.enable_fee_tax === 'yes';

  const receiptHeader = settings?.wepos_receipts?.receipt_header || '';
  const receiptFooter = settings?.wepos_receipts?.receipt_footer || '';

  // Allow pro plugin to completely replace the receipt content
  const proReceiptContent = applyFilters<React.ReactNode>(
    'wepos_react_receipt_content',
    null,
    printdata,
    settings,
    formatPrice,
    selectedGateway,
  );

  return (
    <Modal
      onRequestClose={onClose}
      className="wepos-sale-completed-modal pui-root"
      shouldCloseOnClickOutside={true}
      shouldCloseOnEsc={true}
      __experimentalHideHeader
      style={{
        backgroundColor: "var(--background)"
      }}
    >
      {/* Sale Completed visible UI */}
      <div className="flex flex-col items-center py-8 px-6">
        <div
          className="flex items-center justify-center rounded-full mb-6 w-20 h-20 bg-success"
        >
          <Check size={40} className='text-success-foreground' />
        </div>

        <h2
          className="text-2xl font-semibold mb-8 text-success!"
        >
          {__('Sale Completed', 'wepos')}
        </h2>

        <div className="flex gap-4">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 rounded bg-primary text-primary-foreground font-medium cursor-pointer border-none text-sm"
          >
            <Printer size={18} />
            {__('Print Receipt', 'wepos')}
          </button>

          <button
            onClick={handleNewSale}
            className="flex items-center gap-2 px-6 py-3 rounded bg-secondary text-secondary-foreground font-medium cursor-pointer border-none text-sm"
          >
            <Plus size={18} />
            {__('New Sale', 'wepos')}
          </button>
        </div>
      </div>

      {/* Hidden receipt content — React renders here, innerHTML is cloned to body for printing */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div id="wepos-print-receipt">
          {proReceiptContent ? (
            proReceiptContent
          ) : (
            <div className="wepos-checkout-print-wrapper">
              {/* Header from admin settings */}
              {receiptHeader && (
                <div
                  className="header"
                  dangerouslySetInnerHTML={{ __html: receiptHeader }}
                />
              )}

              {/* Order Info */}
              <div className="order-info">
                <span><strong>{__('Order ID', 'wepos')}: #{printdata.order_id}</strong></span>
                <span><strong>{__('Order Date', 'wepos')}: {printdata.order_date ? formatDate(printdata.order_date) : ''}</strong></span>
              </div>

              {/* Content */}
              <div className="content">
                <table className="sale-summary">
                  <tbody>
                    {(printdata.line_items || []).map((item, index) => (
                      <tr key={index}>
                        <td className="name">
                          {item.name}
                          {isTaxInclusive && (
                            <span className="tax-info">
                              {__('Tax includes', 'wepos')}: {formatPrice((item as any).total_tax || 0)}
                            </span>
                          )}
                          {item.attribute && item.attribute.length > 0 && (
                            <div className="attribute">
                              <ul>
                                {item.attribute.map((attr: any, attrIdx: number) => (
                                  <li key={attrIdx}>
                                    <span className="attr_name">{attr.name}</span>: <span className="attr_value">{attr.option}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </td>
                        <td className="quantity">{item.quantity}</td>
                        <td className="price">
                          {item.on_sale ? (
                            <>
                              <span className="regular-price">{formatPrice(item.quantity * item.regular_price)}</span>
                              <span className="sale-price">{formatPrice(item.quantity * item.sale_price)}</span>
                            </>
                          ) : (
                            <span className="sale-price">{formatPrice(item.quantity * item.regular_price)}</span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* Subtotal */}
                    <tr className="cart-meta-data">
                      <td colSpan={2} className="name">
                        {__('Subtotal', 'wepos')}
                        {isTaxInclusive && (
                          <span className="metadata">{__('Including Tax', 'wepos')}</span>
                        )}
                      </td>
                      <td className="price">{formatPrice(printdata.subtotal || 0)}</td>
                    </tr>

                    {/* Discount lines */}
                    {(printdata.coupon_lines || []).map((fee: any, idx: number) => (
                      <tr key={`disc-${idx}`} className="cart-meta-data">
                        <td colSpan={2} className="name">
                          {__('Discount', 'wepos')}{' '}
                          <span className="metadata">
                            {fee.discount_type === 'percent' ? `${fee.value}%` : formatPrice(fee.value)}
                          </span>
                        </td>
                        <td className="price">-{formatPrice(Math.abs(fee.total))}</td>
                      </tr>
                    ))}

                    {/* Fee lines */}
                    {(printdata.fee_lines || []).map((fee: any, idx: number) => (
                      <tr key={`fee-${idx}`} className="cart-meta-data">
                        <td colSpan={2} className="name">
                          {__('Fee', 'wepos')}{' '}
                          <span className="metadata">
                            {fee.fee_type === 'percent' ? `${fee.value}%` : formatPrice(fee.value)}
                          </span>
                        </td>
                        <td className="price">{formatPrice(Math.abs(fee.total))}</td>
                      </tr>
                    ))}

                    {/* Tax */}
                    {Number(printdata.taxtotal) > 0 && (
                      <tr>
                        <td colSpan={2} className="name">
                          {isTaxInclusive && isFeeTaxEnabled
                            ? __('Fee Tax', 'wepos')
                            : __('Tax', 'wepos')}
                        </td>
                        <td className="price">{formatPrice(printdata.taxtotal)}</td>
                      </tr>
                    )}

                    {/* Order Total */}
                    <tr>
                      <td colSpan={2} className="name">{__('Order Total', 'wepos')}</td>
                      <td className="price">{formatPrice(printdata.ordertotal || 0)}</td>
                    </tr>

                    <tr className="divider">
                      <td colSpan={3}></td>
                    </tr>

                    {/* Payment method */}
                    <tr>
                      <td colSpan={2}>{__('Payment method', 'wepos')}</td>
                      <td className="price">{printdata.gateway?.title || ''}</td>
                    </tr>

                    {/* Cash payment details */}
                    {printdata.gateway?.id === 'wepos_cash' && (
                      <>
                        <tr>
                          <td colSpan={2}>{__('Cash Given', 'wepos')}</td>
                          <td className="price">{formatPrice(printdata.cashamount || 0)}</td>
                        </tr>
                        <tr>
                          <td colSpan={2}>{__('Change Money', 'wepos')}</td>
                          <td className="price">{formatPrice(printdata.changeamount || 0)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer from admin settings */}
              {receiptFooter && (
                <div
                  className="footer"
                  dangerouslySetInnerHTML={{ __html: receiptFooter }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptModal;
