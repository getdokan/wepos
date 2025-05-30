import React, { useState, useEffect, useRef, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';
import { Users, Plus, ChevronRight, Edit3 } from 'lucide-react';
import { Customer } from '../types';
import { posAPI } from '../api';
import CustomerModal from './CustomerModal';

interface CustomerSearchProps {
  selectedCustomer?: Customer | null;
  onCustomerSelected: (customer: Customer | null) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({
  selectedCustomer,
  onCustomerSelected,
  onFocus,
  onBlur,
}) => {
  // State management
  const [searchValue, setSearchValue] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Update search value when customer is selected externally
  useEffect(() => {
    if (selectedCustomer) {
      setSearchValue(
        `${selectedCustomer.first_name} ${selectedCustomer.last_name}`,
      );
    } else {
      setSearchValue('');
    }
  }, [selectedCustomer]);

  // Search customers with debouncing
  const searchCustomers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setCustomers([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await posAPI.customers.getCustomers(query);
      setCustomers(results);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomers([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || customers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < customers.length - 1 ? prev + 1 : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : customers.length - 1,
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < customers.length) {
          handleCustomerSelect(customers[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Reset selected index when customers change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [customers]);

  // Handle search input change with debouncing
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setSelectedIndex(-1); // Reset selection on new search

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      searchCustomers(value);
    }, 300);
  };

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelected(customer);
    setSearchValue(`${customer.first_name} ${customer.last_name}`);
    setShowResults(false);
  };

  // Handle input focus
  const handleFocus = () => {
    setShowResults(true);
    onFocus?.();
  };

  // Handle input blur (with delay to allow for clicks)
  const handleBlur = () => {
    setTimeout(() => {
      setShowResults(false);
      onBlur?.();
    }, 200);
  };

  // Clear customer selection
  const handleClearCustomer = () => {
    onCustomerSelected(null);
    setSearchValue('');
    setShowResults(false);
  };

  // Handle new customer creation
  const handleCustomerCreated = (newCustomer: Customer) => {
    handleCustomerSelect(newCustomer);
  };

  // Handle customer update
  const handleCustomerUpdated = (updatedCustomer: Customer) => {
    handleCustomerSelect(updatedCustomer);
  };

  // Open new customer modal
  const handleOpenNewCustomerModal = () => {
    setEditingCustomer(null);
    setShowCustomerModal(true);
  };

  // Open edit customer modal
  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setEditingCustomer(selectedCustomer);
      setShowCustomerModal(true);
    }
  };

  // Close customer modal
  const handleCloseCustomerModal = () => {
    setShowCustomerModal(false);
    setEditingCustomer(null);
  };

  return (
    <div className="relative flex-1">
      {/* Search Input - Hide when customer is selected */}
      {!selectedCustomer && (
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={__('Search Customer or Walk-in', 'wepos')}
            className="focus:ring-wepos-primary/20 focus:border-wepos-primary h-10 w-full rounded-lg border border-gray-300 bg-white pr-10 pl-10 text-sm placeholder-gray-500 transition-colors outline-none focus:ring-2"
          />

          {/* Customer Icon */}
          <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 transform">
            <Users className="text-wepos-primary h-4 w-4" />
          </div>

          {/* Add Customer Button */}
          <button
            type="button"
            onClick={handleOpenNewCustomerModal}
            className="text-wepos-primary hover:text-wepos-primary-hover focus:ring-wepos-primary/20 absolute top-1/2 right-3 -translate-y-1/2 transform rounded transition-colors focus:ring-2 focus:outline-none"
            title={__('Add New Customer', 'wepos')}
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Loading indicator */}
          {isSearching && (
            <div className="absolute top-1/2 right-10 -translate-y-1/2 transform">
              <Spinner />
            </div>
          )}
        </div>
      )}

      {/* Selected Customer Display - Replace search input when customer is selected */}
      {selectedCustomer && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-sm">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Users className="text-wepos-primary h-5 w-5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gray-900">
                {selectedCustomer.first_name} {selectedCustomer.last_name}
              </div>
              <div className="truncate text-xs text-gray-500">
                {selectedCustomer.email}
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleEditCustomer}
              className="text-wepos-primary hover:text-wepos-primary-hover hover:bg-wepos-primary/5 focus:ring-wepos-primary/20 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors focus:ring-2 focus:outline-none"
              title={__('Edit Customer', 'wepos')}
            >
              <Edit3 className="h-3 w-3" />
              {__('Edit', 'wepos')}
            </button>
            <button
              type="button"
              onClick={handleClearCustomer}
              className="rounded px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
              title={__('Clear Customer', 'wepos')}
            >
              {__('Clear', 'wepos')}
            </button>
          </div>
        </div>
      )}

      {/* Search Results */}
      {showResults && !selectedCustomer && (
        <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {customers.length > 0 ? (
            <ul className="py-1">
              {customers.map((customer, index) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => handleCustomerSelect(customer)}
                    className={`flex w-full items-center gap-3 border-b border-gray-100 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                      index === selectedIndex
                        ? 'bg-wepos-primary/10 border-l-wepos-primary border-l-4'
                        : ''
                    }`}
                  >
                    <img
                      src={customer.avatar_url}
                      alt={`${customer.first_name} ${customer.last_name}`}
                      className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900">
                        {customer.first_name} {customer.last_name}
                      </div>
                      <div className="truncate text-xs text-gray-500">
                        {customer.email}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-6 text-center text-sm text-gray-500">
              {__('No customer found', 'wepos')}
            </div>
          )}

          {/* Navigation hints */}
          <div className="flex flex-wrap gap-4 border-t border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-xs">
                ↑↓
              </kbd>
              <span className="whitespace-nowrap">
                {__('to navigate', 'wepos')}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-xs">
                ↵
              </kbd>
              <span className="whitespace-nowrap">
                {__('to select', 'wepos')}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-xs">
                esc
              </kbd>
              <span className="whitespace-nowrap">
                {__('to dismiss', 'wepos')}
              </span>
            </span>
          </div>
        </div>
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
};

export default CustomerSearch;
