# WePos React Components

## Customer Components Overview

The customer functionality is built with focused, single-responsibility components:

### 1. CustomerSearch Component

**Purpose**: Handles customer search, selection, and editing functionality.

**Features**:

- Real-time customer search with debounced input (300ms delay)
- Keyboard navigation (↑/↓ arrows, Enter, Esc)
- Visual feedback for search results and selection
- Selected customer display with edit and clear options
- Integration with CustomerModal for creating and editing customers
- Edit existing customer information directly from search

**Props**:

```typescript
interface CustomerSearchProps {
  selectedCustomer?: Customer | null;
  onCustomerSelected: (customer: Customer | null) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}
```

### 2. CustomerModal Component

**Purpose**: Handles both customer creation and editing functionality in a single modal.

**Features**:

- Modal form for creating new customers
- Editing existing customer information
- Billing and shipping address management
- Country/State dynamic dropdown selection
- Form validation (required fields)
- Loading states during customer operations
- Integration with WordPress countries/states data
- Automatic mode detection (create vs edit)

**Props**:

```typescript
interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated?: (customer: Customer) => void;
  onCustomerUpdated?: (customer: Customer) => void;
  editingCustomer?: Customer | null; // When provided, modal opens in edit mode
}
```

## Usage Examples

### Basic Usage (Recommended)

```tsx
import CustomerSearch from './CustomerSearch';

function CartComponent() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const handleCustomerSelected = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    // Update order data with customer information
  };

  return (
    <CustomerSearch
      selectedCustomer={selectedCustomer}
      onCustomerSelected={handleCustomerSelected}
    />
  );
}
```

### Standalone Customer Modal for Creating

```tsx
import CustomerModal from './CustomerModal';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  const handleCustomerCreated = (newCustomer: Customer) => {
    console.log('New customer created:', newCustomer);
    setShowModal(false);
  };

  return (
    <CustomerModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      onCustomerCreated={handleCustomerCreated}
    />
  );
}
```

### Standalone Customer Modal for Editing

```tsx
import CustomerModal from './CustomerModal';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const handleCustomerUpdated = (updatedCustomer: Customer) => {
    console.log('Customer updated:', updatedCustomer);
    setShowModal(false);
  };

  const startEditing = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowModal(true);
  };

  return (
    <CustomerModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      onCustomerUpdated={handleCustomerUpdated}
      editingCustomer={editingCustomer}
    />
  );
}
```

## Component Relationships

```
CustomerSearch
├── Uses CustomerModal internally for both create and edit
├── Handles search input and results
├── Manages customer selection state
├── Provides "Add Customer" button
└── Provides "Edit Customer" button when customer is selected

CustomerModal
├── Handles both customer creation and editing
├── Auto-detects mode based on editingCustomer prop
├── Country/State management
├── Form validation
└── API integration for both create and update operations
```

## Customer Editing Features

### In CustomerSearch Component:

- **Edit Button**: Appears next to "Clear" when a customer is selected
- **Edit Icon**: Uses Lucide's `Edit3` icon
- **Quick Access**: Edit customer information without leaving the search interface

### In CustomerModal Component:

- **Mode Detection**: Automatically switches between "Add New Customer" and "Edit Customer" based on props
- **Pre-filled Form**: When editing, form is automatically populated with existing customer data
- **Dynamic Title**: Modal title changes based on the mode
- **Smart Updates**: Preserves existing data when updating customer information

## Benefits of This Architecture

### 1. **Single Responsibility Principle**

- `CustomerSearch`: Handles search, selection, and customer management UI
- `CustomerModal`: Handles customer data form operations (create/edit)

### 2. **Better User Experience**

- Edit customers directly from the search interface
- No need to navigate away from the POS interface
- Consistent modal experience for both creating and editing

### 3. **Enhanced Maintainability**

- Single modal component handles both create and edit operations
- Shared form validation and styling
- Reduced code duplication

### 4. **Better Code Organization**

- Clear separation between search/selection and data entry
- Reusable modal component
- Consistent customer management patterns

## Keyboard Shortcuts

- **F7**: Focus customer search (global shortcut - to be implemented)
- **Shift+F7**: Open new customer modal (global shortcut - to be implemented)
- **↑/↓**: Navigate search results
- **Enter**: Select highlighted customer
- **Esc**: Close search results or modal

## Dependencies

### CustomerSearch

- `@wordpress/components`: Spinner
- `lucide-react`: Users, Plus, ChevronRight, Edit3 icons
- `@wordpress/i18n`: Translation functions

### CustomerModal

- `@wordpress/components`: Modal, TextControl, SelectControl, Button
- `@wordpress/i18n`: Translation functions

## API Integration

Both components use `posAPI.customers` endpoints:

- `getCustomers(search?: string)`: Search for customers
- `createCustomer(customerData)`: Create new customer
- `updateCustomer(id, customerData)`: Update existing customer

## Styling

Component styles are defined in `src/frontend/styles/components.css` and follow the WePos design system with Tailwind CSS utility classes.
