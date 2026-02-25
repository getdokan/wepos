import React from 'react';
import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { POSPrintData } from '../types';
import { Check, CircleCheck, Plus, Printer } from 'lucide-react';

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
        {/* Green checkmark circle */}
        <div
          className="flex items-center justify-center rounded-full mb-6 w-20 h-20 bg-success"
        >
          <Check size={40} className='text-success-foreground' />
        </div>

        {/* Sale Completed text */}
        <h2
          className="text-2xl font-semibold mb-8 text-success!"
        >
          {__('Sale Completed', 'wepos')}
        </h2>

        {/* Action buttons */}
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

      {/* Hidden receipt content for printing */}
      <div style={{ display: 'none' }}>
        <div id="wepos-print-receipt">
          <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>WePos Store</div>
            <div style={{ fontSize: '10px' }}>Point of Sale Receipt</div>
          </div>

          {printdata.order_id && (
            <p style={{ fontSize: '12px', marginBottom: '4px' }}>
              <strong>{__('Order #:', 'wepos')}</strong> {printdata.order_id}
            </p>
          )}
          {printdata.order_date && (
            <p style={{ fontSize: '12px', marginBottom: '4px' }}>
              <strong>{__('Date:', 'wepos')}</strong> {new Date(printdata.order_date).toLocaleDateString()}
            </p>
          )}
          <p style={{ fontSize: '12px', marginBottom: '8px' }}>
            <strong>{__('Payment Method:', 'wepos')}</strong> {printdata.gateway?.title || __('N/A', 'wepos')}
          </p>

          {printdata.line_items && printdata.line_items.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '8px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '2px 1px', borderBottom: '1px solid #000', textAlign: 'left' }}>{__('Item', 'wepos')}</th>
                  <th style={{ padding: '2px 1px', borderBottom: '1px solid #000', textAlign: 'left' }}>{__('Qty', 'wepos')}</th>
                  <th style={{ padding: '2px 1px', borderBottom: '1px solid #000', textAlign: 'left' }}>{__('Price', 'wepos')}</th>
                  <th style={{ padding: '2px 1px', borderBottom: '1px solid #000', textAlign: 'left' }}>{__('Total', 'wepos')}</th>
                </tr>
              </thead>
              <tbody>
                {printdata.line_items.map((item, index) => (
                  <tr key={index}>
                    <td style={{ padding: '2px 1px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>{item.name}</td>
                    <td style={{ padding: '2px 1px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>{item.quantity}</td>
                    <td style={{ padding: '2px 1px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                      {item.on_sale ? formatPrice(item.sale_price) : formatPrice(item.regular_price)}
                    </td>
                    <td style={{ padding: '2px 1px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                      {item.on_sale ? formatPrice(item.quantity * item.sale_price) : formatPrice(item.quantity * item.regular_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>{__('Subtotal:', 'wepos')}</span>
            <span>{formatPrice(printdata.subtotal || 0)}</span>
          </div>

          {printdata.taxtotal && printdata.taxtotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>{__('Tax:', 'wepos')}</span>
              <span>{formatPrice(printdata.taxtotal)}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '4px', marginTop: '4px' }}>
            <span>{__('Total:', 'wepos')}</span>
            <span>{formatPrice(printdata.ordertotal || 0)}</span>
          </div>

          {selectedGateway === 'wepos_cash' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', marginTop: '4px' }}>
                <span>{__('Cash Received:', 'wepos')}</span>
                <span>{formatPrice(printdata.cashamount || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>{__('Change:', 'wepos')}</span>
                <span>{formatPrice(printdata.changeamount || 0)}</span>
              </div>
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: '16px', borderTop: '1px dashed #000', paddingTop: '8px', fontSize: '10px' }}>
            <div>{__('Thank you for your business!', 'wepos')}</div>
            <div>{__('Visit us again soon', 'wepos')}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptModal;
