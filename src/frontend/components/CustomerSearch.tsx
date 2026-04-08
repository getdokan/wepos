import { useState, useCallback, forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { UserPen, User } from 'lucide-react';
import {
  SmartSelect,
  type SmartSelectOption,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Button,
  toast,
} from '@wedevs/plugin-ui';
import { Customer } from '../types';
import { posAPI } from '../api';
import CustomerModal from './CustomerModal';

interface CustomerSearchProps {
  selectedCustomer?: Customer | null;
  onCustomerSelected: (customer: Customer | null) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
}

export interface CustomerSearchHandle {
  focus: () => void;
  openNewCustomer: () => void;
}

const customerToOption = (customer: Customer): SmartSelectOption => ({
  value: String(customer.id),
  label: `${customer.first_name} ${customer.last_name}`.trim(),
  description: customer.email,
});

const CustomerSearch = forwardRef<CustomerSearchHandle, CustomerSearchProps>(({
  selectedCustomer,
  onCustomerSelected,
  className = ''
}, ref) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      // Programmatically click the SmartSelect trigger to open it
      const trigger = triggerRef.current?.querySelector('[data-slot="smart-select-trigger"]') as HTMLButtonElement | null;
      trigger?.click();
    },
    openNewCustomer: () => {
      setEditingCustomer(null);
      setShowCustomerModal(true);
    },
  }));

  // Search handler for SmartSelect
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setCustomers([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await posAPI.customers.getCustomers(query);
      setCustomers(results);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomers([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Build options - always use selectedCustomer's latest data for the selected entry
  const options = useMemo(() => {
    const selectedId = selectedCustomer?.id;
    const opts: SmartSelectOption[] = customers
      .filter(c => c.id !== selectedId)
      .map(customerToOption);

    if (selectedCustomer) {
      opts.unshift(customerToOption(selectedCustomer));
    }

    return opts;
  }, [customers, selectedCustomer]);

  // Handle value change from SmartSelect
  const handleValueChange = useCallback((value: string) => {
    if (!value) {
      onCustomerSelected(null);
      return;
    }

    const customer = customers.find(c => String(c.id) === value)
      || (selectedCustomer && String(selectedCustomer.id) === value ? selectedCustomer : null);

    if (customer) {
      onCustomerSelected(customer);
    }
  }, [customers, selectedCustomer, onCustomerSelected]);

  // Custom render for options with avatar
  const renderOption = useCallback((option: SmartSelectOption) => {
    const customer = customers.find(c => String(c.id) === option.value)
      || (selectedCustomer && String(selectedCustomer.id) === option.value ? selectedCustomer : null);

    return (
      <div className="flex items-center gap-3 w-full">
        <Avatar size="sm" shape="circle" className="shrink-0">
          {customer?.avatar_url && (
            <AvatarImage src={customer.avatar_url} alt={option.label} />
          )}
          <AvatarFallback>
            <User className="size-4" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <span className="text-foreground text-sm font-semibold">{option.label}</span>
          {option.description && (
            <span className="text-muted-foreground ml-3 text-sm">{option.description}</span>
          )}
        </div>
      </div>
    );
  }, [customers, selectedCustomer]);

  // Edit customer
  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setEditingCustomer(selectedCustomer);
      setShowCustomerModal(true);
    }
  };

  // Customer modal handlers
  const handleCustomerCreated = (newCustomer: Customer) => {
    onCustomerSelected(newCustomer);
    setCustomers(prev => [newCustomer, ...prev]);
    toast.success(sprintf(__('Customer %s created', 'wepos'), `${newCustomer.first_name} ${newCustomer.last_name}`));
  };

  const handleCustomerUpdated = (updatedCustomer: Customer) => {
    onCustomerSelected(updatedCustomer);
    toast.success(sprintf(__('Customer %s updated', 'wepos'), `${updatedCustomer.first_name} ${updatedCustomer.last_name}`));
  };

  const handleCloseCustomerModal = () => {
    setShowCustomerModal(false);
    setEditingCustomer(null);
  };

  return (
    <div className={`flex items-center gap-1 ${className}`} ref={triggerRef}>
      {/* SmartSelect for customer search */}
      <SmartSelect
        onSearch={handleSearch}
        options={options}
        value={selectedCustomer ? String(selectedCustomer.id) : ''}
        onValueChange={handleValueChange}
        loading={isSearching}
        placeholder={__('Search customer', 'wepos')}
        searchPlaceholder={__('Search customer', 'wepos')}
        emptyMessage={__('No customer found', 'wepos')}
        idleMessage={__('Start typing to search', 'wepos')}
        showClear={true}
        showChevron={false}
        startIcon={<User className="size-4" />}
        renderOption={renderOption}
        className="flex-1 min-w-0 h-9"
        contentClassName={selectedCustomer ? '!w-[calc(var(--anchor-width)+2.5rem)]' : undefined}
      />

      {/* Edit button - outside to the right, only when customer is selected */}
      {selectedCustomer && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleEditCustomer}
          className="shrink-0 h-9 w-9 bg-accent text-primary hover:text-primary-hover hover:bg-accent rounded-md"
          title={__('Edit Customer', 'wepos')}
        >
          <UserPen className="size-4" />
        </Button>
      )}

      {/* Customer Modal (for both creating and editing) */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={handleCloseCustomerModal}
        onCustomerCreated={handleCustomerCreated}
        onCustomerUpdated={handleCustomerUpdated}
        editingCustomer={editingCustomer}
      />
    </div>
  );
});

export default CustomerSearch;
