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
    window.print();
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
      <div className="wepos-receipt-wrapper">
        <div className="wepos-receipt-content">
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
