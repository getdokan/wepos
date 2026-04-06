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
import { POSFeeLine } from '../types';

interface AddFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFee: (fee: POSFeeLine) => void;
  defaultTaxStatus?: 'taxable' | 'none';
}

const TAX_CLASSES = [
  { value: '', label: 'Standard rate' },
  { value: 'reduced-rate', label: 'Reduced rate' },
  { value: 'zero-rate', label: 'Zero rate' },
];

const AddFeeModal: React.FC<AddFeeModalProps> = ({
  isOpen,
  onClose,
  onAddFee,
  defaultTaxStatus = 'taxable',
}) => {
  const [name, setName] = useState('Fee');
  const [amount, setAmount] = useState('0.00');
  const [isPercentage, setIsPercentage] = useState(false);
  const [amountIncludesTax, setAmountIncludesTax] = useState(false);
  const [taxClass, setTaxClass] = useState('');
  const [taxStatus, setTaxStatus] = useState<'taxable' | 'none'>(defaultTaxStatus);

  const resetForm = () => {
    setName('Fee');
    setAmount('0.00');
    setIsPercentage(false);
    setAmountIncludesTax(false);
    setTaxClass('');
    setTaxStatus(defaultTaxStatus);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    onAddFee({
      name: name.trim() || 'Fee',
      type: 'fee',
      value: (parseFloat(amount) || 0).toString(),
      fee_type: isPercentage ? 'percent' : 'fixed',
      tax_status: taxStatus,
      tax_class: taxClass === '_standard' ? '' : taxClass,
      total: 0,
    });
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()} dismissible={false}>
    <DialogContent className="max-w-135 gap-0 p-0" showCloseButton={false}>
      <DialogHeader className="border-b border-border px-6 py-4 flex-row items-center justify-between">
        <DialogTitle className="text-lg font-semibold text-foreground">
          {__('Add Fee', 'wepos')}
        </DialogTitle>
        <DialogClose render={<Button variant="ghost" size="icon-sm" />}>
          <X className="h-4 w-4" />
        </DialogClose>
      </DialogHeader>

      <div className="space-y-4 px-6 py-5">
        <div>
          <Label className="mb-1.5 block text-sm font-medium">
            {__('Fee Name', 'wepos')}
          </Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

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

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={isPercentage}
              onCheckedChange={setIsPercentage}
            />
            <Label className="text-sm">
              {__('Percentage of Cart Total', 'wepos')}
            </Label>
          </div>
          <div className="flex items-center gap-2">
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
                <RadioGroupItem value="taxable" id="fee-tax-taxable" />
                <Label htmlFor="fee-tax-taxable" className="cursor-pointer text-sm">
                  {__('Taxable', 'wepos')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="none" id="fee-tax-none" />
                <Label htmlFor="fee-tax-none" className="cursor-pointer text-sm">
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
          {__('Add Fee', 'wepos')}
        </Button>
      </DialogFooter>
    </DialogContent>
    </Dialog>
  );
};

export default AddFeeModal;
