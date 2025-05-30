import React, { useState, useRef, useEffect } from 'react';
import { Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

interface FeeKeypadProps {
  name: string;
  onInputFee: (value: number, type: 'percent' | 'fixed') => void;
  className?: string;
  isDiscount?: boolean;
}

const FeeKeypad: React.FC<FeeKeypadProps> = ({
  name,
  onInputFee,
  className,
  isDiscount = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Focus input when popover opens
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  const handleNumberClick = (number: string) => {
    if (displayValue.length < 10) {
      setDisplayValue((prev) => prev + number);
    }
  };

  const handleDecimalClick = () => {
    if (!displayValue.includes('.')) {
      setDisplayValue((prev) => prev + '.');
    }
  };

  const handleBackspace = () => {
    setDisplayValue((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setDisplayValue('');
  };

  const handlePercentClick = () => {
    const value = parseFloat(displayValue);
    if (!isNaN(value) && value > 0) {
      onInputFee(value, 'percent');
      setDisplayValue('');
      setIsVisible(false);
    }
  };

  const handleFixedClick = () => {
    const value = parseFloat(displayValue);
    if (!isNaN(value) && value > 0) {
      onInputFee(value, 'fixed');
      setDisplayValue('');
      setIsVisible(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (/^\d*\.?\d*$/.test(value) && value.length <= 10) {
      setDisplayValue(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePercentClick();
      } else {
        handleFixedClick();
      }
    } else if (e.key === 'Escape') {
      setIsVisible(false);
    }
  };

  return (
    <div className={`inline-block ${className || ''}`}>
      <button
        ref={buttonRef}
        type="button"
        className="focus:ring-opacity-20 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100 focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsVisible(!isVisible)}
      >
        {__('Add', 'wepos')} {name}
      </button>

      {isVisible && (
        <Popover
          anchor={buttonRef.current}
          placement="top"
          onClose={() => setIsVisible(false)}
          className="wepos-fee-keypad-popover"
        >
          <div className="w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
            {/* Input Display */}
            <div className="mb-4">
              <input
                ref={inputRef}
                type="text"
                value={displayValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            {/* Keypad */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              {/* Numbers 1-9 */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  className="h-12 rounded-lg bg-gray-100 text-lg font-medium transition-colors hover:bg-gray-200"
                  onClick={() => handleNumberClick(num.toString())}
                >
                  {num}
                </button>
              ))}

              {/* Bottom row: Clear, 0, Decimal */}
              <button
                type="button"
                className="h-12 rounded-lg bg-red-100 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
                onClick={handleClear}
              >
                ⌫
              </button>
              <button
                type="button"
                className="h-12 rounded-lg bg-gray-100 text-lg font-medium transition-colors hover:bg-gray-200"
                onClick={() => handleNumberClick('0')}
              >
                0
              </button>
              <button
                type="button"
                className="h-12 rounded-lg bg-gray-100 text-lg font-medium transition-colors hover:bg-gray-200"
                onClick={handleDecimalClick}
              >
                .
              </button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  isDiscount
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                onClick={handlePercentClick}
                disabled={!displayValue || parseFloat(displayValue) <= 0}
              >
                % {name}
              </button>
              <button
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  isDiscount
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                onClick={handleFixedClick}
                disabled={!displayValue || parseFloat(displayValue) <= 0}
              >
                {window.wepos?.currency_format_symbol} {name}
              </button>
            </div>
          </div>
        </Popover>
      )}
    </div>
  );
};

export default FeeKeypad;
