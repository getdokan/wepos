import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { __ } from '@wordpress/i18n';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Button,
  Input,
} from '@wedevs/plugin-ui';
import { Delete } from 'lucide-react';

interface FeeKeypadProps {
  name: string;
  onInputFee: (value: number, type: 'percent' | 'fixed') => void;
  className?: string;
  isDiscount?: boolean;
}

export interface FeeKeypadHandle {
  open: () => void;
}

const FeeKeypad = forwardRef<FeeKeypadHandle, FeeKeypadProps>(({
  name,
  onInputFee,
  className,
  isDiscount = false,
}, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useImperativeHandle(ref, () => ({
    open: () => setIsVisible(true),
  }));

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
      <Popover open={isVisible} onOpenChange={setIsVisible}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
          >
            {__('Add', 'wepos')} {name}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-64 p-4" align="start">
          <div className="flex flex-col gap-4">
            {/* Input Display */}
            <div>
              <Input
                ref={inputRef}
                type="text"
                value={displayValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                className="text-center text-xl"
                placeholder="0"
              />
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {/* Numbers 1-9 */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Button
                  key={num}
                  variant="secondary"
                  className="h-12 text-lg font-medium"
                  onClick={() => handleNumberClick(num.toString())}
                >
                  {num}
                </Button>
              ))}

              {/* Bottom row: Clear, 0, Decimal */}
              <Button
                variant="outline"
                className="h-12 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleClear}
              >
                <Delete size={20} />
              </Button>
              <Button
                variant="secondary"
                className="h-12 text-lg font-medium"
                onClick={() => handleNumberClick('0')}
              >
                0
              </Button>
              <Button
                variant="secondary"
                className="h-12 text-lg font-medium"
                onClick={handleDecimalClick}
              >
                .
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={isDiscount ? 'success' : 'default'}
                className="w-full"
                onClick={handlePercentClick}
                disabled={!displayValue || parseFloat(displayValue) <= 0}
              >
                % {name}
              </Button>
              <Button
                variant={isDiscount ? 'success' : 'default'}
                className="w-full"
                onClick={handleFixedClick}
                disabled={!displayValue || parseFloat(displayValue) <= 0}
              >
                {window.wepos?.currency_format_symbol} {name}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});

export default FeeKeypad;
