import React from 'react';

interface HelpModalProps {
  show: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="wepos-help-wrapper">
          <h2>Shortcut Keys</h2>
          <ul>
            <li>
              <span className="code"><code>f3</code></span>
              <span className="title">Toggle Product View</span>
            </li>
            <li>
              <span className="code"><code>f8</code></span>
              <span className="title">Create New Sale</span>
            </li>
            <li>
              <span className="code"><code>shift+f8</code></span>
              <span className="title">Empty your cart</span>
            </li>
            <li>
              <span className="code"><code>f9</code></span>
              <span className="title">Process Payment</span>
            </li>
            <li>
              <span className="code"><code>ctrl/cmd+?</code></span>
              <span className="title">Show/Close Help</span>
            </li>
            <li>
              <span className="code"><code>esc</code></span>
              <span className="title">Close anything</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
