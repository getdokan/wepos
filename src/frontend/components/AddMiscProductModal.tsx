import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@wedevs/plugin-ui';
import { RadioGroup, RadioGroupItem } from '@wedevs/plugin-ui';

interface AddMiscProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: {
    name: string;
    sku: string;
    price: number;
    tax_class: string;
    tax_status: 'taxable' | 'none';
  }) => void;
}

const TAX_CLASSES = [
  { value: '', label: 'Standard rate' },
  { value: 'reduced-rate', label: 'Reduced rate' },
  { value: 'zero-rate', label: 'Zero rate' },
];

const AddMiscProductModal: React.FC<AddMiscProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
}) => {
  const [name, setName] = useState('Product');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('0.00');
  const [taxClass, setTaxClass] = useState('');
  const [taxStatus, setTaxStatus] = useState<'taxable' | 'none'>('none');

  const resetForm = () => {
    setName('Product');
    setSku('');
    setPrice('0.00');
    setTaxClass('');
    setTaxStatus('none');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    onAddProduct({
      name: name.trim() || 'Product',
      sku,
      price: parseFloat(price) || 0,
      tax_class: taxClass,
      tax_status: taxStatus,
    });
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()} dismissible={false}>
    <DialogContent className="max-w-135 p-0!">
      <DialogHeader className="border-b border-border px-6 py-5">
        <DialogTitle className="text-lg font-bold text-foreground">
          {__('Add Miscellaneous Product', 'wepos')}
        </DialogTitle>
      </DialogHeader>

      <Separator />

      <div className="space-y-5 px-6 py-6">
        <div>
          <Label className="mb-2 block text-sm font-medium">
            {__('Name', 'wepos')}
          </Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <Label className="mb-2 block text-sm font-medium">
            {__('SKU', 'wepos')}
          </Label>
          <Input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
        </div>

        <div>
          <Label className="mb-2 block text-sm font-medium">
            {__('Price', 'wepos')}
          </Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block text-sm font-medium">
              {__('Tax Class', 'wepos')}
            </Label>
            <Select value={taxClass} onValueChange={(val) => setTaxClass(val ?? '')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAX_CLASSES.map((tc) => (
                  <SelectItem key={tc.value} value={tc.value || '_standard'}>
                    {tc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block text-sm font-medium">
              {__('Tax Status', 'wepos')}
            </Label>
            <RadioGroup
              value={taxStatus}
              onValueChange={(val) => setTaxStatus(val as 'taxable' | 'none')}
              className="mt-2 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="taxable" id="misc-tax-taxable" />
                <Label htmlFor="misc-tax-taxable" className="cursor-pointer text-sm">
                  {__('Taxable', 'wepos')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="none" id="misc-tax-none" />
                <Label htmlFor="misc-tax-none" className="cursor-pointer text-sm">
                  {__('None', 'wepos')}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>

      <DialogFooter className="border-t border-border flex justify-end gap-2 px-6 py-4">
        <Button variant="outline" onClick={handleClose}>
          {__('Cancel', 'wepos')}
        </Button>
        <Button onClick={handleSubmit}>
          {__('Add to Cart', 'wepos')}
        </Button>
      </DialogFooter>
    </DialogContent>
    </Dialog>
  );
};

export default AddMiscProductModal;
