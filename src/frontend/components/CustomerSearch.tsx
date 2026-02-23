import React, { useState, useEffect, useRef, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { Search, Plus, ChevronRight, Edit3, Users } from 'lucide-react';
import {
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  ScrollArea,
  Spinner,
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

const CustomerSearch: React.FC<CustomerSearchProps> = ({
  selectedCustomer,
  onCustomerSelected,
  onFocus,
  onBlur,
  className=''
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
    <div className={`relative ${className}`}>
      {/* Search Input - Hide when customer is selected */}
      {!selectedCustomer && (
        <InputGroup className="h-10">
          <InputGroupAddon align="inline-start">
            <Search className="text-muted-foreground size-4" />
          </InputGroupAddon>

          <InputGroupInput
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={__('Search Customer or Walk-in', 'wepos')}
          />

          <InputGroupAddon align="inline-end">
            {isSearching && <Spinner className="text-primary mr-1" />}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InputGroupButton
                    onClick={handleOpenNewCustomerModal}
                    size="icon-xs"
                    className="text-primary hover:text-primary-hover"
                  >
                    <Plus className="size-4" />
                  </InputGroupButton>
                </TooltipTrigger>
                <TooltipContent>
                  {__('Add New Customer', 'wepos')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </InputGroupAddon>
        </InputGroup>
      )}

      {/* Selected Customer Display - Replace search input when customer is selected */}
      {selectedCustomer && (
        <div className="border-border bg-card flex items-center justify-between rounded-lg border px-3 py-0 shadow-sm">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar className="h-5 w-5">
              <AvatarImage
                src={selectedCustomer.avatar_url}
                alt={`${selectedCustomer.first_name} ${selectedCustomer.last_name}`}
              />
              <AvatarFallback>
                <Users className="text-primary size-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-foreground truncate text-sm font-medium">
                {selectedCustomer.first_name} {selectedCustomer.last_name}
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditCustomer}
              className="text-primary hover:text-primary-hover hover:bg-primary/5 focus-visible:ring-primary/20 flex h-8 items-center gap-1 px-2 text-xs font-medium transition-colors focus-visible:ring-2"
              title={__('Edit Customer', 'wepos')}
            >
              <Edit3 className="size-3" />
              {__('Edit', 'wepos')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCustomer}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 focus-visible:ring-destructive/20 h-8 px-2 text-xs font-medium transition-colors focus-visible:ring-2"
              title={__('Clear Customer', 'wepos')}
            >
              {__('Clear', 'wepos')}
            </Button>
          </div>
        </div>
      )}

      {/* Search Results */}
      {showResults && !selectedCustomer && (
        <div className="border-border bg-popover absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-md border shadow-lg">
          <ScrollArea className="max-h-60">
            {customers.length > 0 ? (
              <ul className="py-1">
                {customers.map((customer, index) => (
                  <li key={customer.id}>
                    <button
                      type="button"
                      onClick={() => handleCustomerSelect(customer)}
                      className={`border-border hover:bg-accent focus:bg-accent flex w-full items-center gap-3 border-b px-3 py-2 text-left transition-colors last:border-b-0 focus:outline-none ${
                        index === selectedIndex
                          ? 'bg-accent border-l-primary border-l-4'
                          : ''
                      }`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage
                          src={customer.avatar_url}
                          alt={`${customer.first_name} ${customer.last_name}`}
                        />
                        <AvatarFallback>
                          <Users className="size-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="text-foreground truncate text-sm font-medium">
                          {customer.first_name} {customer.last_name}
                        </div>
                        <div className="text-muted-foreground truncate text-xs">
                          {customer.email}
                        </div>
                      </div>
                      <ChevronRight className="text-muted-foreground size-4 flex-shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted-foreground px-3 py-6 text-center text-sm">
                {__('No customer found', 'wepos')}
              </div>
            )}
          </ScrollArea>

          {/* Navigation hints */}
          <div className="border-border bg-muted/50 text-muted-foreground flex flex-wrap gap-4 border-t px-3 py-2 text-xs">
            <span className="flex items-center gap-1">
              <kbd className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
                ↑↓
              </kbd>
              <span className="whitespace-nowrap">
                {__('to navigate', 'wepos')}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
                ↵
              </kbd>
              <span className="whitespace-nowrap">
                {__('to select', 'wepos')}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
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
