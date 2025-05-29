import React from 'react';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

interface HelpModalProps {
  show: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <Modal
      title={__('Keyboard Shortcuts', 'wepos')}
      onRequestClose={onClose}
      className="wepos-help-modal"
      shouldCloseOnClickOutside={true}
      shouldCloseOnEsc={true}
    >
      <div className="wepos-help-wrapper">
        <ul className="space-y-3">
          <li className="text-gray-700 flex items-center gap-4 py-2">
            <span className="code">F3</span>
            <span>{__('Toggle between grid and list view', 'wepos')}</span>
          </li>
          <li className="text-gray-700 flex items-center gap-4 py-2">
            <span className="code">F8</span>
            <span>{__('Create new sale', 'wepos')}</span>
          </li>
          <li className="text-gray-700 flex items-center gap-4 py-2">
            <span className="code">Shift + F8</span>
            <span>{__('Empty current cart', 'wepos')}</span>
          </li>
          <li className="text-gray-700 flex items-center gap-4 py-2">
            <span className="code">F9</span>
            <span>{__('Proceed to payment', 'wepos')}</span>
          </li>
          <li className="text-gray-700 flex items-center gap-4 py-2">
            <span className="code">ESC</span>
            <span>{__('Close modal or go back', 'wepos')}</span>
          </li>
          <li className="text-gray-700 flex items-center gap-4 py-2">
            <span className="code">Ctrl + ?</span>
            <span>{__('Show/hide this help', 'wepos')}</span>
          </li>
        </ul>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {__('These shortcuts work from anywhere in the POS interface to help speed up your workflow.', 'wepos')}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default HelpModal;
