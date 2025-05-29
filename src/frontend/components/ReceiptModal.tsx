import React from 'react';
import { POSPrintData } from '../types';

interface ReceiptModalProps {
  show: boolean;
  printdata: POSPrintData;
  selectedGateway: string;
  onClose: () => void;
  onNewSale: () => void;
  formatPrice: (amount: number | string | undefined | null) => string;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({
  show,
  printdata,
  selectedGateway,
  onClose,
  onNewSale,
  formatPrice,
}) => {
  if (!show) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleNewSale = () => {
    onNewSale();
    onClose();
  };

  return (
    <div className="wepos-modal-overlay" onClick={onClose}>
      <div className="wepos-modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="wepos-receipt-wrapper">
          <div className="wepos-receipt-header">
            <h2>Order Receipt</h2>
            <button
              onClick={onClose}
              className="wepos-receipt-close"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="wepos-receipt-content">
            <div className="wepos-receipt-info">
              {printdata.order_id && (
                <p><strong>Order #:</strong> {printdata.order_id}</p>
              )}
              {printdata.order_date && (
                <p><strong>Date:</strong> {new Date(printdata.order_date).toLocaleDateString()}</p>
              )}
              <p><strong>Payment Method:</strong> {printdata.gateway?.title || 'N/A'}</p>
            </div>

            <div className="wepos-receipt-items">
              <h3>Items</h3>
              {printdata.line_items && printdata.line_items.length > 0 ? (
                <table className="wepos-receipt-table">
                  <thead>
                    <tr>
                      <th className="wepos-receipt-th">Item</th>
                      <th className="wepos-receipt-th">Qty</th>
                      <th className="wepos-receipt-th">Price</th>
                      <th className="wepos-receipt-th">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printdata.line_items.map((item, index) => (
                      <tr key={index}>
                        <td className="wepos-receipt-td">{item.name}</td>
                        <td className="wepos-receipt-td">{item.quantity}</td>
                        <td className="wepos-receipt-td">
                          {item.on_sale ?
                            formatPrice(item.sale_price) :
                            formatPrice(item.regular_price)
                          }
                        </td>
                        <td className="wepos-receipt-td">
                          {item.on_sale ?
                            formatPrice(item.quantity * item.sale_price) :
                            formatPrice(item.quantity * item.regular_price)
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No items found</p>
              )}
            </div>

            <div className="wepos-receipt-totals">
              <div className="total-line">
                <span>Subtotal:</span>
                <span>{formatPrice(printdata.subtotal || 0)}</span>
              </div>

              {printdata.taxtotal && printdata.taxtotal > 0 && (
                <div className="total-line">
                  <span>Tax:</span>
                  <span>{formatPrice(printdata.taxtotal)}</span>
                </div>
              )}

              <div className="final-total">
                <span>Total:</span>
                <span>{formatPrice(printdata.ordertotal || 0)}</span>
              </div>

              {selectedGateway === 'wepos_cash' && (
                <>
                  <div className="total-line">
                    <span>Cash Received:</span>
                    <span>{formatPrice(printdata.cashamount || 0)}</span>
                  </div>
                  <div className="total-line">
                    <span>Change:</span>
                    <span>{formatPrice(printdata.changeamount || 0)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="wepos-receipt-footer">
            <button
              className="wepos-button wepos-btn-print"
              onClick={handlePrint}
              type="button"
            >
              Print Receipt
            </button>
            <button
              className="wepos-button wepos-btn-new-sale"
              onClick={handleNewSale}
              type="button"
            >
              New Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
