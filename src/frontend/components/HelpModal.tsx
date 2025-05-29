import React from 'react';

interface HelpModalProps {
  show: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="wepos-modal-overlay" onClick={onClose}>
      <div className="wepos-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="wepos-help-wrapper">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Keyboard Shortcuts</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <ul className="space-y-3">
            <li className="flex items-center gap-4 py-2">
              <span className="code">F3</span>
              <span className="flex-1">Toggle Product View (Grid/List)</span>
            </li>
            <li className="flex items-center gap-4 py-2">
              <span className="code">F8</span>
              <span className="flex-1">Create New Sale</span>
            </li>
            <li className="flex items-center gap-4 py-2">
              <span className="code">Shift+F8</span>
              <span className="flex-1">Empty your cart</span>
            </li>
            <li className="flex items-center gap-4 py-2">
              <span className="code">F9</span>
              <span className="flex-1">Process Payment</span>
            </li>
            <li className="flex items-center gap-4 py-2">
              <span className="code">Ctrl+?</span>
              <span className="flex-1">Show/Close Help</span>
            </li>
            <li className="flex items-center gap-4 py-2">
              <span className="code">Esc</span>
              <span className="flex-1">Close anything</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
