import React from 'react';
import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
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
    const receiptElement = document.getElementById('wepos-print-receipt');
    if (receiptElement) {
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>WePos Receipt</title>
            <style>
              @page { margin: 0; }
              body {
                margin: 0;
                padding: 8px;
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.3;
                color: black;
                background: white;
              }
              table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px; }
              th, td { padding: 2px 1px; border-bottom: 1px solid #ddd; text-align: left; }
              th { font-weight: bold; border-bottom: 1px solid #000; }
              .total-line, .final-total { display: flex; justify-content: space-between; margin-bottom: 2px; }
              .final-total { font-weight: bold; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
              .print-only { display: block !important; }
              .screen-only { display: none !important; }
            </style>
          </head>
          <body>
            ${receiptElement.innerHTML}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    } else {
      // Fallback to standard print
      window.print();
    }
  };

  const handleNewSale = () => {
    onNewSale();
    onClose();
  };

  return (
    <Modal
      title={__('Order Receipt', 'wepos')}
      onRequestClose={onClose}
      className="wepos-receipt-modal"
      shouldCloseOnClickOutside={true}
      shouldCloseOnEsc={true}
      size="medium"
    >
      <div className="wepos-receipt-wrapper" id="wepos-print-receipt">
        <div className="wepos-receipt-content">
          {/* Store/Business Header for print */}
          <div className="print-only" style={{ display: 'none' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>WePos Store</div>
              <div style={{ fontSize: '10px' }}>Point of Sale Receipt</div>
            </div>
          </div>

          <div className="wepos-receipt-info mb-6">
            {printdata.order_id && (
              <p className="text-sm text-gray-600 mb-2">
                <strong>{__('Order #:', 'wepos')}</strong> {printdata.order_id}
              </p>
            )}
            {printdata.order_date && (
              <p className="text-sm text-gray-600 mb-2">
                <strong>{__('Date:', 'wepos')}</strong> {new Date(printdata.order_date).toLocaleDateString()}
              </p>
            )}
            <p className="text-sm text-gray-600 mb-2">
              <strong>{__('Payment Method:', 'wepos')}</strong> {printdata.gateway?.title || __('N/A', 'wepos')}
            </p>
          </div>

          <div className="wepos-receipt-items mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">{__('Items', 'wepos')}</h3>
            {printdata.line_items && printdata.line_items.length > 0 ? (
              <table className="wepos-receipt-table w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="wepos-receipt-th border-b border-gray-200 p-2 text-left bg-gray-50 font-semibold">{__('Item', 'wepos')}</th>
                    <th className="wepos-receipt-th border-b border-gray-200 p-2 text-left bg-gray-50 font-semibold">{__('Qty', 'wepos')}</th>
                    <th className="wepos-receipt-th border-b border-gray-200 p-2 text-left bg-gray-50 font-semibold">{__('Price', 'wepos')}</th>
                    <th className="wepos-receipt-th border-b border-gray-200 p-2 text-left bg-gray-50 font-semibold">{__('Total', 'wepos')}</th>
                  </tr>
                </thead>
                <tbody>
                  {printdata.line_items.map((item, index) => (
                    <tr key={index}>
                      <td className="wepos-receipt-td border-b border-gray-200 p-2 text-left">{item.name}</td>
                      <td className="wepos-receipt-td border-b border-gray-200 p-2 text-left">{item.quantity}</td>
                      <td className="wepos-receipt-td border-b border-gray-200 p-2 text-left">
                        {item.on_sale ?
                          formatPrice(item.sale_price) :
                          formatPrice(item.regular_price)
                        }
                      </td>
                      <td className="wepos-receipt-td border-b border-gray-200 p-2 text-left">
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
              <p className="text-gray-500">{__('No items found', 'wepos')}</p>
            )}
          </div>

          <div className="wepos-receipt-totals">
            <div className="total-line flex justify-between py-1 text-sm">
              <span>{__('Subtotal:', 'wepos')}</span>
              <span>{formatPrice(printdata.subtotal || 0)}</span>
            </div>

            {printdata.taxtotal && printdata.taxtotal > 0 && (
              <div className="total-line flex justify-between py-1 text-sm">
                <span>{__('Tax:', 'wepos')}</span>
                <span>{formatPrice(printdata.taxtotal)}</span>
              </div>
            )}

            <div className="final-total flex justify-between py-2 text-lg font-bold border-t border-gray-300 mt-2">
              <span>{__('Total:', 'wepos')}</span>
              <span>{formatPrice(printdata.ordertotal || 0)}</span>
            </div>

            {selectedGateway === 'wepos_cash' && (
              <>
                <div className="total-line flex justify-between py-1 text-sm">
                  <span>{__('Cash Received:', 'wepos')}</span>
                  <span>{formatPrice(printdata.cashamount || 0)}</span>
                </div>
                <div className="total-line flex justify-between py-1 text-sm">
                  <span>{__('Change:', 'wepos')}</span>
                  <span>{formatPrice(printdata.changeamount || 0)}</span>
                </div>
              </>
            )}
          </div>

          {/* Print-only footer */}
          <div className="print-only" style={{ display: 'none' }}>
            <div style={{ textAlign: 'center', marginTop: '16px', borderTop: '1px dashed #000', paddingTop: '8px', fontSize: '10px' }}>
              <div>{__('Thank you for your business!', 'wepos')}</div>
              <div>{__('Visit us again soon', 'wepos')}</div>
            </div>
          </div>
        </div>

        <div className="wepos-receipt-footer flex gap-3 pt-4 border-t border-gray-200 mt-6">
          <Button
            variant="secondary"
            onClick={handlePrint}
            className="wepos-btn-print"
          >
            {__('Print Receipt', 'wepos')}
          </Button>
          <Button
            variant="primary"
            onClick={handleNewSale}
            className="wepos-btn-new-sale"
          >
            {__('New Sale', 'wepos')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptModal;
