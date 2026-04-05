import React, { useState, useEffect, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { LoaderCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  SmartSelect,
  Separator,
} from '@wedevs/plugin-ui';
import { Customer, BillingAddress } from '../types';
import { posAPI } from '../api';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated?: (customer: Customer) => void;
  onCustomerUpdated?: (customer: Customer) => void;
  editingCustomer?: Customer | null;
}

interface CustomerFormData {
  first_name: string;
  last_name: string;
  email: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
}

const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onCustomerCreated,
  onCustomerUpdated,
  editingCustomer = null,
}) => {
  // Determine if we're in edit mode
  const isEditMode = !!editingCustomer;

  // Form state
  const [customerForm, setCustomerForm] = useState<CustomerFormData>({
    first_name: '',
    last_name: '',
    email: '',
    address_1: '',
    address_2: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
    phone: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [availableStates, setAvailableStates] = useState<
    Array<{ value: string; label: string }>
  >([]);

  // Country and state data from WordPress globals
  const countries = (window as any).wepos?.countries || {};
  const states = (window as any).wepos?.states || {};

  // Country options for SmartSelect
  const countryOptions = useMemo(
    () =>
      Object.entries(countries).map(([code, name]) => ({
        value: code,
        label: name as string,
      })),
    [countries],
  );

  // State options for SmartSelect
  const stateOptions = useMemo(
    () => availableStates.map((s) => ({ value: s.value, label: s.label })),
    [availableStates],
  );

  // Load existing customer data when editing
  useEffect(() => {
    if (isEditMode && editingCustomer) {
      const billing = editingCustomer.billing || {};
      setCustomerForm({
        first_name: editingCustomer.first_name || '',
        last_name: editingCustomer.last_name || '',
        email: editingCustomer.email || '',
        address_1: billing.address_1 || '',
        address_2: billing.address_2 || '',
        city: billing.city || '',
        state: billing.state || '',
        postcode: billing.postcode || '',
        country: billing.country || '',
        phone: billing.phone || '',
      });
      setSelectedCountry(billing.country || '');
    }
  }, [isEditMode, editingCustomer]);

  // Update available states when country changes
  useEffect(() => {
    if (selectedCountry && states[selectedCountry]) {
      const stateOptions = Object.entries(states[selectedCountry]).map(
        ([code, name]) => ({
          value: code,
          label: name as string,
        }),
      );
      setAvailableStates(stateOptions);
    } else {
      setAvailableStates([]);
      setCustomerForm((prev) => ({ ...prev, state: '' }));
    }
  }, [selectedCountry, states]);

  // Handle form field changes
  const handleFormChange = (field: keyof CustomerFormData, value: string) => {
    setCustomerForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handle country selection
  const handleCountryChange = (code: string) => {
    setSelectedCountry(code);
    setCustomerForm((prev) => ({ ...prev, country: code, state: '' }));
  };

  // Handle state selection
  const handleStateChange = (val: string) => {
    setCustomerForm((prev) => ({ ...prev, state: val }));
  };

  // Check if form is valid
  const isFormValid =
    customerForm.first_name.trim() !== '' &&
    customerForm.email.trim() !== '';

  // Save customer (create or update)
  const handleSaveCustomer = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    try {
      const customerData: Partial<Customer> = {
        email: customerForm.email,
        first_name: customerForm.first_name,
        last_name: customerForm.last_name,
        username: isEditMode ? editingCustomer!.username : customerForm.email,
        billing: {
          first_name: customerForm.first_name,
          last_name: customerForm.last_name,
          address_1: customerForm.address_1,
          address_2: customerForm.address_2,
          city: customerForm.city,
          state: customerForm.state,
          postcode: customerForm.postcode,
          country: customerForm.country,
          phone: customerForm.phone,
          email: customerForm.email,
          company: '',
        } as BillingAddress,
        shipping: {
          first_name: customerForm.first_name,
          last_name: customerForm.last_name,
          address_1: customerForm.address_1,
          address_2: customerForm.address_2,
          city: customerForm.city,
          state: customerForm.state,
          postcode: customerForm.postcode,
          country: customerForm.country,
          company: '',
        },
      };

      let savedCustomer: Customer;

      if (isEditMode) {
        savedCustomer = await posAPI.customers.updateCustomer(
          editingCustomer!.id,
          customerData,
        );
        onCustomerUpdated?.(savedCustomer);
      } else {
        const createdCustomer = await posAPI.customers.createCustomer(customerData);
        // WooCommerce create customer endpoint sometimes returns simplified data.
        // Fetch the full customer object to ensure billing/shipping addresses are complete.
        savedCustomer = await posAPI.customers.getCustomer(createdCustomer.id);
        onCustomerCreated?.(savedCustomer);
      }

      handleClose();
    } catch (error) {
      console.error(
        `Error ${isEditMode ? 'updating' : 'creating'} customer:`,
        error,
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setCustomerForm({
      first_name: '',
      last_name: '',
      email: '',
      address_1: '',
      address_2: '',
      city: '',
      state: '',
      postcode: '',
      country: '',
      phone: '',
    });
    setSelectedCountry('');
  };

  // Handle modal close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()} dismissible={false}>
    <DialogContent className="wepos-customer-modal max-w-175 p-0!">
      {/* Header */}
      <DialogHeader className="border-b border-border px-6 py-5">
        <DialogTitle className="text-lg font-bold text-foreground">
          {isEditMode
            ? __('Edit Customer', 'wepos')
            : __('Add New Customer', 'wepos')}
        </DialogTitle>
      </DialogHeader>

      <Separator />

      {/* Form Body */}
      <div className="space-y-5 px-6 py-6">
        {/* First Name / Last Name */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="text"
            placeholder={__('First Name*', 'wepos')}
            value={customerForm.first_name}
            onChange={(e) => handleFormChange('first_name', e.target.value)}
            required
          />
          <Input
            type="text"
            placeholder={__('Last Name', 'wepos')}
            value={customerForm.last_name}
            onChange={(e) => handleFormChange('last_name', e.target.value)}
          />
        </div>

        {/* Email */}
        <Input
          type="email"
          placeholder={__('Email*', 'wepos')}
          value={customerForm.email}
          onChange={(e) => handleFormChange('email', e.target.value)}
          required
        />

        {/* Address 1 / Address 2 */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="text"
            placeholder={__('Address 1', 'wepos')}
            value={customerForm.address_1}
            onChange={(e) => handleFormChange('address_1', e.target.value)}
          />
          <Input
            type="text"
            placeholder={__('Address 2 (optional)', 'wepos')}
            value={customerForm.address_2}
            onChange={(e) => handleFormChange('address_2', e.target.value)}
          />
        </div>

        {/* Country / State */}
        <div className="grid grid-cols-2 gap-4">
          <SmartSelect
            options={countryOptions}
            value={selectedCountry}
            onValueChange={handleCountryChange}
            placeholder={__('Select a country', 'wepos')}
            emptyMessage={__('No country found.', 'wepos')}
            showClear
            className="w-full"
          />

          {availableStates.length > 0 ? (
            <SmartSelect
              options={stateOptions}
              value={customerForm.state}
              onValueChange={handleStateChange}
              placeholder={__('Select a state', 'wepos')}
              emptyMessage={__('No state found.', 'wepos')}
              showClear
              className="w-full"
            />
          ) : (
            <Input
              type="text"
              placeholder={__('States (optional)', 'wepos')}
              value={customerForm.state}
              onChange={(e) => handleFormChange('state', e.target.value)}
            />
          )}
        </div>

        {/* City / Zip Code */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="text"
            placeholder={__('City (optional)', 'wepos')}
            value={customerForm.city}
            onChange={(e) => handleFormChange('city', e.target.value)}
          />
          <Input
            type="text"
            placeholder={__('Zip/Postal Code (optional)', 'wepos')}
            value={customerForm.postcode}
            onChange={(e) => handleFormChange('postcode', e.target.value)}
          />
        </div>

        {/* Phone */}
        <Input
          type="tel"
          placeholder={__('Phone (optional)', 'wepos')}
          value={customerForm.phone}
          onChange={(e) => handleFormChange('phone', e.target.value)}
        />
      </div>

      {/* Footer */}
      <DialogFooter className="border-t border-border flex justify-end px-6 py-4">
        <Button
          onClick={handleSaveCustomer}
          disabled={!isFormValid || isLoading}
          className="px-8"
        >
          {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode
            ? __('Update Customer', 'wepos')
            : __('Add Customer', 'wepos')}
        </Button>
      </DialogFooter>
    </DialogContent>
    </Dialog>
  );
};

export default CustomerModal;
