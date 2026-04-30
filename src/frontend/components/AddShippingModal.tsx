import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  SmartSelect,
  Switch,
} from '@wedevs/plugin-ui';
import { RadioGroup, RadioGroupItem } from '@wedevs/plugin-ui';
import { POSShippingLine } from '../types';

interface AddShippingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddShipping: (shipping: POSShippingLine) => void;
}

const SHIPPING_METHODS = [
  { value: 'flat_rate', label: 'Flat rate' },
  { value: 'free_shipping', label: 'Free shipping' },
  { value: 'local_pickup', label: 'Local pickup' },
];

const TAX_CLASSES = [
  { value: '', label: 'Standard rate' },
  { value: 'reduced-rate', label: 'Reduced rate' },
  { value: 'zero-rate', label: 'Zero rate' },
];

const AddShippingModal: React.FC<AddShippingModalProps> = ({
  isOpen,
  onClose,
  onAddShipping,
}) => {
  const [methodTitle, setMethodTitle] = useState('Shipping');
  const [methodId, setMethodId] = useState('');
  const [amount, setAmount] = useState('0.00');
  const [amountIncludesTax, setAmountIncludesTax] = useState(false);
  const [taxClass, setTaxClass] = useState('');
  const [taxStatus, setTaxStatus] = useState<'taxable' | 'none'>('taxable');

  const resetForm = () => {
    setMethodTitle('Shipping');
    setMethodId('');
    setAmount('0.00');
    setAmountIncludesTax(false);
    setTaxClass('');
    setTaxStatus('taxable');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    onAddShipping({
      method_title: methodTitle.trim() || 'Shipping',
      method_id: methodId || 'flat_rate',
      total: (parseFloat(amount) || 0).toFixed(2),
      tax_status: taxStatus,
      tax_class: taxClass === '_standard' ? '' : taxClass,
      amount_includes_tax: amountIncludesTax,
    });
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()} dismissible={false}>
    <DialogContent className="max-w-150 gap-0 p-0" showCloseButton={false}>
      <DialogHeader className="border-b border-border px-6 py-4 flex-row items-center justify-between">
        <DialogTitle className="text-lg font-semibold text-foreground">
          {__('Add Shipping', 'wepos')}
        </DialogTitle>
        <DialogClose render={<Button variant="ghost" size="icon-sm" />}>
          <X className="h-4 w-4" />
        </DialogClose>
      </DialogHeader>

      <div className="space-y-4 px-6 py-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block text-sm font-medium">
              {__('Shipping Method Title', 'wepos')}
            </Label>
            <Input
              type="text"
              value={methodTitle}
              onChange={(e) => setMethodTitle(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-medium">
              {__('Shipping Method', 'wepos')}
            </Label>
            <SmartSelect
              options={SHIPPING_METHODS}
              value={methodId}
              onValueChange={(val) => setMethodId(val)}
              placeholder={__('Select Shipping Method', 'wepos')}
              disableSearch
            />
          </div>
        </div>

        <div className="grid grid-cols-2 items-end gap-4">
          <div>
            <Label className="mb-1.5 block text-sm font-medium">
              {__('Amount', 'wepos')}
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Switch
              checked={amountIncludesTax}
              onCheckedChange={setAmountIncludesTax}
            />
            <Label className="text-sm">
              {__('Amount Includes Tax', 'wepos')}
            </Label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block text-sm font-medium">
              {__('Tax Class', 'wepos')}
            </Label>
            <SmartSelect
              options={TAX_CLASSES.map((tc) => ({ value: tc.value || '_standard', label: tc.label }))}
              value={taxClass || '_standard'}
              onValueChange={(val) => setTaxClass(val === '_standard' ? '' : val)}
              placeholder={__('Select Tax Class', 'wepos')}
              disableSearch
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-sm font-medium">
              {__('Tax Status', 'wepos')}
            </Label>
            <RadioGroup
              value={taxStatus}
              onValueChange={(val) => setTaxStatus(val as 'taxable' | 'none')}
              className="mt-2 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="taxable" id="ship-tax-taxable" />
                <Label htmlFor="ship-tax-taxable" className="cursor-pointer text-sm">
                  {__('Taxable', 'wepos')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="none" id="ship-tax-none" />
                <Label htmlFor="ship-tax-none" className="cursor-pointer text-sm">
                  {__('None', 'wepos')}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>

      <DialogFooter className="border-t border-border gap-2 px-6 py-4">
        <Button variant="outline" onClick={handleClose}>
          {__('Cancel', 'wepos')}
        </Button>
        <Button onClick={handleSubmit}>
          {__('Add Shipping', 'wepos')}
        </Button>
      </DialogFooter>
    </DialogContent>
    </Dialog>
  );
};

export default AddShippingModal;
