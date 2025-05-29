import React from 'react';
import { POSPrintData, POSCartItem } from '../../types';

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="wepos-receipt-wrapper">
          <div className="header">
            <h2>Payment Receipt</h2>
            <span className="close-btn" onClick={onClose}>×</span>
          </div>
          <div className="content">
            <div className="receipt-info">
              <p><strong>Order ID:</strong> {printdata.order_id}</p>
              <p><strong>Date:</strong> {printdata.order_date ? new Date(printdata.order_date).toLocaleDateString() : ''}</p>
              <p><strong>Payment Method:</strong> {printdata.gateway?.title}</p>
            </div>

            <div className="receipt-items">
              <h3>Items</h3>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {printdata.line_items?.map((item: POSCartItem, index: number) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatPrice(item.quantity * (item.on_sale ? item.sale_price : item.regular_price))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="receipt-totals">
              <div className="total-line">
                <span>Subtotal:</span>
                <span>{formatPrice(printdata.subtotal || 0)}</span>
              </div>
              {(printdata.taxtotal || 0) > 0 && (
                <div className="total-line">
                  <span>Tax:</span>
                  <span>{formatPrice(printdata.taxtotal || 0)}</span>
                </div>
              )}
              <div className="total-line final-total">
                <span>Total:</span>
                <span>{formatPrice(printdata.ordertotal || 0)}</span>
              </div>

              {selectedGateway === 'wepos_cash' && (
                <>
                  <div className="total-line">
                    <span>Cash Tendered:</span>
                    <span>{formatPrice(parseFloat(printdata.cashamount || '0'))}</span>
                  </div>
                  <div className="total-line">
                    <span>Change:</span>
                    <span>{formatPrice(parseFloat(printdata.changeamount || '0'))}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="footer">
            <button
              className="print-btn"
              onClick={() => {
                window.print();
              }}
            >
              Print Receipt
            </button>
            <button
              className="new-sale-btn"
              onClick={() => {
                onClose();
                onNewSale();
              }}
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
