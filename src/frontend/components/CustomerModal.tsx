import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import {
  Modal,
  TextControl,
  SelectControl,
  Button,
} from '@wordpress/components';
import { Customer, BillingAddress } from '../types';
import { posAPI } from '../api';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated?: (customer: Customer) => void;
  onCustomerUpdated?: (customer: Customer) => void;
  editingCustomer?: Customer | null; // Add this prop for editing mode
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

  // Country options
  const countryOptions = Object.entries(countries).map(([code, name]) => ({
    value: code,
    label: name as string,
  }));

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
  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setCustomerForm((prev) => ({ ...prev, country: countryCode, state: '' }));
  };

  // Handle state selection
  const handleStateChange = (stateCode: string) => {
    setCustomerForm((prev) => ({ ...prev, state: stateCode }));
  };

  // Check if form is valid
  const isFormValid =
    customerForm.first_name.trim() !== '' &&
    customerForm.last_name.trim() !== '' &&
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
          company: '', // Add required fields
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
          company: '', // Add required fields
        },
      };

      let savedCustomer: Customer;

      if (isEditMode) {
        // Update existing customer
        savedCustomer = await posAPI.customers.updateCustomer(
          editingCustomer!.id,
          customerData,
        );
        onCustomerUpdated?.(savedCustomer);
      } else {
        // Create new customer
        savedCustomer = await posAPI.customers.createCustomer(customerData);
        onCustomerCreated?.(savedCustomer);
      }

      handleClose();
    } catch (error) {
      console.error(
        `Error ${isEditMode ? 'updating' : 'creating'} customer:`,
        error,
      );
      // TODO: Show error notification
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
    <Modal
      title={
        isEditMode
          ? __('Edit Customer', 'wepos')
          : __('Add New Customer', 'wepos')
      }
      onRequestClose={handleClose}
      className="wepos-customer-modal"
      style={{ maxWidth: '700px' }}
    >
      <div className="wepos-customer-form space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextControl
            label={__('First Name', 'wepos')}
            value={customerForm.first_name}
            onChange={(value) => handleFormChange('first_name', value)}
            placeholder={__('First Name', 'wepos')}
            required
          />
          <TextControl
            label={__('Last Name', 'wepos')}
            value={customerForm.last_name}
            onChange={(value) => handleFormChange('last_name', value)}
            placeholder={__('Last Name', 'wepos')}
            required
          />
        </div>

        {/* Email */}
        <TextControl
          label={__('Email', 'wepos')}
          type="email"
          value={customerForm.email}
          onChange={(value) => handleFormChange('email', value)}
          placeholder={__('Email', 'wepos')}
          required
        />

        {/* Address Fields */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextControl
            label={__('Address 1', 'wepos')}
            value={customerForm.address_1}
            onChange={(value) => handleFormChange('address_1', value)}
            placeholder={__('Address 1', 'wepos')}
          />
          <TextControl
            label={__('Address 2 (optional)', 'wepos')}
            value={customerForm.address_2}
            onChange={(value) => handleFormChange('address_2', value)}
            placeholder={__('Address 2 (optional)', 'wepos')}
          />
        </div>

        {/* Country and State */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectControl
            label={__('Country', 'wepos')}
            value={selectedCountry}
            onChange={handleCountryChange}
            options={[
              { value: '', label: __('Select a country', 'wepos') },
              ...countryOptions,
            ]}
          />
          {availableStates.length > 0 ? (
            <SelectControl
              label={__('State', 'wepos')}
              value={customerForm.state}
              onChange={handleStateChange}
              options={[
                { value: '', label: __('Select a state', 'wepos') },
                ...availableStates,
              ]}
            />
          ) : (
            <TextControl
              label={__('State (optional)', 'wepos')}
              value={customerForm.state}
              onChange={(value) => handleFormChange('state', value)}
              placeholder={__('State (optional)', 'wepos')}
            />
          )}
        </div>

        {/* City and Postal Code */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextControl
            label={__('City (optional)', 'wepos')}
            value={customerForm.city}
            onChange={(value) => handleFormChange('city', value)}
            placeholder={__('City (optional)', 'wepos')}
          />
          <TextControl
            label={__('Zip/Postal Code (optional)', 'wepos')}
            value={customerForm.postcode}
            onChange={(value) => handleFormChange('postcode', value)}
            placeholder={__('Zip/Postal Code (optional)', 'wepos')}
          />
        </div>

        {/* Phone */}
        <TextControl
          label={__('Phone (optional)', 'wepos')}
          type="tel"
          value={customerForm.phone}
          onChange={(value) => handleFormChange('phone', value)}
          placeholder={__('Phone (optional)', 'wepos')}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button variant="tertiary" onClick={handleClose} disabled={isLoading}>
            {__('Cancel', 'wepos')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveCustomer}
            disabled={!isFormValid || isLoading}
            isBusy={isLoading}
          >
            {isEditMode
              ? __('Update Customer', 'wepos')
              : __('Add Customer', 'wepos')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CustomerModal;
