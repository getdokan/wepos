import React from 'react';
import { __ } from '@wordpress/i18n';
import { Modal, Separator } from '@wedevs/plugin-ui';

interface HelpModalProps {
  show: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: 'f1', label: 'Search Product' },
  { key: 'f2', label: 'Scan Product' },
  { key: 'f3', label: 'Toggle Product View' },
  { key: 'f4', label: 'Add Fee in cart' },
  { key: 'f5', label: 'Add Discount in cart' },
  { key: 'f6', label: 'Add Customer note' },
  { key: 'f7', label: 'Customer Search' },
  { key: 'shift+f7', label: 'Add new Customer' },
  { key: 'f8', label: 'Create New Sale' },
  { key: 'shift+f8', label: 'Empty your cart' },
  { key: 'f9', label: 'Go to payment receipt' },
  { key: 'f10', label: 'Process Payment' },
  { key: 'ctrl/cmd+p', label: 'Print Receipt' },
  { key: 'ctrl/cmd+?', label: 'Show/Close(Toggle) Help' },
  { key: 'esc', label: 'Close anything' },
];

const HelpModal: React.FC<HelpModalProps> = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <Modal
      open={show}
      onClose={onClose}
      showCloseButton={true}
      closeOnOverlayClick={true}
      closeOnEscape={true}
      className="wepos-help-modal max-w-200 p-0!"
    >
      <div className="px-8 pt-6 pb-2">
        <h2 className="text-muted-foreground text-2xl font-light">
          {__('Shortcut Keys', 'wepos')}
        </h2>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-12 gap-y-5 px-8 py-6">
        {shortcuts.map((item) => (
          <div key={item.key} className="flex items-center gap-4">
            <code className="text-muted-foreground w-28 shrink-0 font-mono text-sm">
              {item.key}
            </code>
            <span className="text-foreground text-sm">
              {__(item.label, 'wepos')}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default HelpModal;
