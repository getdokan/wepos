# WePos React Frontend

## Overview

This is the React.js frontend implementation of the WePos Point of Sale system, migrated from the original Vue.js version while maintaining exact functionality parity.

## Architecture

### Technology Stack

- **React 18** with TypeScript
- **@wordpress/api-fetch** for REST API integration
- **WordPress Components** for UI consistency
- **CSS** styling (converted from Vue.js/LESS)

### Key Features Implemented

- ✅ Product catalog with grid/list view toggle
- ✅ Category filtering
- ✅ Shopping cart management
- ✅ Quantity editing
- ✅ Payment gateway integration
- ✅ **Payment processing with WooCommerce orders**
- ✅ **Receipt generation and display**
- ✅ Keyboard shortcuts (F3, F8, F9, ESC, Ctrl+?)
- ✅ Customer search
- ✅ Real-time price calculations
- ✅ Modal dialogs (Help, Payment, Receipt)
- ✅ Local storage persistence

## API Integration

### WordPress REST API

The application uses `@wordpress/api-fetch` for secure communication with WordPress REST API endpoints:

```typescript
import apiFetch from '@wordpress/api-fetch';

// Fetch products
const response = (await apiFetch({
  path: `/${window.wepos.rest.posversion}/products?status=publish&per_page=30&page=${page}`,
})) as Product[];
```

### Endpoints Used

- `/wp-json/wepos/v1/products` - Product catalog
- `/wp-json/wepos/v1/payment/gateways` - Payment gateways
- `/wp-json/wepos/v1/settings` - POS settings
- `/wp-json/wc/v3/products/categories` - Product categories
- **`/wp-json/wc/v3/orders`** - Order creation
- **`/wp-json/wepos/v1/payment/process`** - Payment processing

## Component Structure

```
src/frontend/
├── components/
│   └── Home.tsx          # Main POS interface (single component approach)
├── types/                # TypeScript interfaces
├── api/                  # API service layer
├── styles/
│   └── main.css         # Converted from Vue.js styles
├── index.tsx            # React entry point (HashRouter)
└── App.tsx              # Router configuration
```

## State Management

Uses React's built-in state management with hooks:

- `useState` for component state
- `useEffect` for lifecycle management
- `useCallback` for optimized functions
- `useRef` for DOM references

### Key State Objects

```typescript
interface CartData {
  line_items: CartItem[];
  fee_lines: any[];
  coupon_lines: any[];
}

interface OrderData {
  customer_id: number;
  customer_note: string;
  payment_method: string;
  payment_method_title: string;
  billing: any;
  shipping: any;
}
```

## Routing

Uses **hash-based routing** with React Router:

- **HashRouter**: Prevents page reloads and server conflicts
- **Single Page App**: All navigation stays within the React app
- **URL Structure**: `http://wepos.test/wepos/#/` (no query parameters)

## Receipt System

### Automatic Print Dialog

After successful payment:

1. ✅ **Receipt Modal**: Shows immediately (no page redirect)
2. ✅ **Print Prompt**: Automatic confirmation dialog
3. ✅ **Visual Success**: Green checkmark and animation
4. ✅ **Order Details**: Complete receipt information

### Receipt Features

- **Animated Modal**: Smooth slide-in animation
- **Success Indicator**: Green checkmark with order confirmation
- **Complete Details**: Order ID, items, totals, payment info
- **Print Integration**: Browser print dialog with proper formatting
- **New Sale Option**: Quick transition to next customer

### Thermal Printer Optimization

- ✅ **80mm Width**: Optimized for standard thermal receipt printers
- ✅ **Print-Only Layout**: Clean thermal printer format without modal elements
- ✅ **Hidden Actions**: Print Receipt and New Sale buttons hidden during print
- ✅ **Automatic Formatting**: Proper spacing, fonts, and borders for thermal receipts
- ✅ **Dual Print Method**: CSS-based print styles + popup window fallback
- ✅ **Print Dialog Fix**: Resolved empty print dialog issue with enhanced targeting

#### Print CSS Features

```css
@media print {
  @page {
    size: 80mm auto;
    margin: 0;
    padding: 0;
  }

  .wepos-receipt-wrapper {
    width: 100% !important;
    max-width: 80mm !important;
    font-size: 12px !important;
  }

  .wepos-receipt-footer {
    display: none !important; /* Hide buttons */
  }
}
```

## Keyboard Shortcuts

- **F3**: Toggle product view (grid/list)
- **F8**: Create new sale
- **Shift+F8**: Empty cart
- **F9**: Process payment
- **Ctrl+?**: Show/hide help
- **ESC**: Close modals/dialogs

## Local Storage

The application automatically saves cart and order data to localStorage:

- Cart data persists between sessions
- Order data maintained during checkout process
- Data restored on page reload

## Authentication

Uses WordPress nonces automatically handled by `@wordpress/api-fetch` for secure API requests. No additional authentication setup required.

## Migration Notes

### From Vue.js to React

- **Data properties** → `useState` hooks
- **Computed properties** → `useCallback` hooks
- **Methods** → React functions
- **Watchers** → `useEffect` hooks
- **Template** → JSX return statement
- **v-model** → controlled components with `value` and `onChange`
- **v-if/v-show** → conditional rendering with `&&` and ternary operators
- **v-for** → `.map()` functions

### Maintained Functionality

✅ Exact feature parity with Vue.js version
✅ Same API endpoints and data structures
✅ Identical keyboard shortcuts
✅ Same UI layout and styling
✅ Compatible with existing PHP backend

## Development

### Build Commands

```bash
# Development build (React)
pnpm run react:start

# Production build (React)
pnpm run react:build

# Development build (Vue.js - legacy)
pnpm run dev:build

# Production build (Vue.js - legacy)
pnpm run build

# Watch mode for development (Vue.js - legacy)
pnpm run dev
```

### TypeScript

Full TypeScript support with interfaces for:

- Product data structures
- Cart and order objects
- API response types
- Component props

## Performance

- Bundle size optimized for WordPress environment
- Lazy loading ready for future enhancements
- Efficient state updates with React hooks
- Minimal re-renders with proper dependency arrays

## Next Steps

1. **Testing**: Add unit tests with Jest and React Testing Library
2. **Accessibility**: Enhance ARIA labels and keyboard navigation
3. **Mobile**: Optimize touch interactions for tablet POS usage
4. **Performance**: Implement code splitting for larger deployments
5. **PWA**: Add service worker for offline capability

## Compatibility

- **WordPress**: 5.0+
- **WooCommerce**: 3.0+
- **PHP**: 7.4+
- **Modern Browsers**: Chrome, Firefox, Safari, Edge

## Troubleshooting

### Payment Processing Issues

**"Order item ID provided is not associated with order" Error:**

- This error occurs when line_items contain extra fields that WooCommerce doesn't expect
- ✅ **Fixed**: Line items now only include `product_id` and `quantity`

**401 Authentication Errors:**

- Ensure `@wordpress/api-fetch` is properly configured
- ✅ **Fixed**: Using `@wordpress/api-fetch` for automatic nonce handling

**Page Redirects After Payment:**

- Payment success was redirecting to URLs with query parameters
- ✅ **Fixed**: Hash-based routing with immediate receipt modal display

**"TypeError: e.toFixed is not a function" Error:**

- This error occurs when non-numeric values are passed to price formatting functions
- ✅ **Fixed**: Enhanced `formatPrice()` function with type checking and NaN handling
- ✅ **Fixed**: Added safety checks to all calculation functions

**Cart Total Calculation Bug (e.g., $45.00 showing as $4500.00):**

- This occurs when product prices from WooCommerce API come as strings but are treated as numbers
- ✅ **Fixed**: Added proper price parsing in `useCart` hook calculation functions
- ✅ **Fixed**: Updated `addToCart` function to parse prices to numbers when adding items
- ✅ **Fixed**: Enhanced type definitions to document string/number price handling

**Order Submission Price Multiplication Issue:**

- Similar to cart calculation, order submission could show incorrect prices in receipts
- This occurs when cart data with unparsed prices is used for receipt generation
- ✅ **Fixed**: Receipt now uses WooCommerce order response data instead of cart data
- ✅ **Fixed**: All receipt prices properly parsed from order response values
- ✅ **Fixed**: Subtotal, tax, and total calculated from actual order totals

**localStorage Price String Conversion Issue:**

- When cart data is saved to localStorage and restored, numbers become strings
- This causes price multiplication issues in PaymentModal ($45.00 becomes $4500.00)
- ✅ **Fixed**: Cart data sanitized on load to ensure all prices are numeric
- ✅ **Fixed**: PaymentModal now properly parses prices before calculations
- ✅ **Fixed**: Type-safe price handling prevents future conversion issues

**Build Issues:**

- Use `pnpm run react:build` for React frontend (not `pnpm run build`)
- Use `pnpm run react:start` for development mode

### Debug Information

- Console logs show order payload structure before submission
- Console logs display WooCommerce order response data
- Console logs show payment processing results and print data
- Check browser network tab for detailed API error responses
- Verify WePos REST API endpoints are accessible

## Payment Processing

### Payment Flow

The payment processing follows a two-step approach matching the original Vue.js implementation:

1. **Order Creation**: Creates a WooCommerce order via `/wc/v3/orders`
2. **Payment Processing**: Processes payment via `/wepos/v1/payment/process`
3. **Receipt Display**: Shows success receipt with order details

```typescript
const processPayment = async () => {
  // Step 1: Create WooCommerce order
  const orderResponse = await apiFetch({
    path: `/${window.wepos.rest.wcversion}/orders`,
    method: 'POST',
    data: orderPayload,
  });

  // Step 2: Process payment
  const paymentResponse = await apiFetch({
    path: `/${window.wepos.rest.posversion}/payment/process`,
    method: 'POST',
    data: orderResponse,
  });

  // Step 3: Show receipt on success
  if (paymentResponse.result === 'success') {
    setShowPaymentReceipt(true);
  }
};
```

### Order Data Structure

```typescript
const orderPayload = {
  billing: orderData.billing,
  shipping: orderData.shipping,
  line_items: cartData.line_items,
  fee_lines: cartData.fee_lines,
  coupon_lines: cartData.coupon_lines,
  customer_id: orderData.customer_id,
  customer_note: orderData.customer_note,
  payment_method: selectedGateway,
  payment_method_title: gatewayTitle,
  meta_data: [
    { key: '_wepos_is_pos_order', value: true },
    { key: '_wepos_cash_tendered_amount', value: cashAmount },
    { key: '_wepos_cash_change_amount', value: changeAmount },
  ],
};
```

### Payment Validation

The system validates payment readiness before processing:

- Cart must contain items
- Payment gateway must be selected
- For cash payments: tendered amount must be ≥ total amount

### Receipt Generation

After successful payment, the system displays a receipt modal with:

- Order ID and date
- Payment method
- Itemized list of products
- Subtotal, tax, and total amounts
- Cash tendered and change (for cash payments)
- Print functionality

## Layout System

### Layout Component

The `Layout` component provides a consistent layout structure with a collapsible sidebar that can be reused across all pages in the application.

#### Usage

```tsx
import Layout from '../components/Layout';

const MyPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('my-page');

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      <div className="wepos-content-product">
        {/* Your page content here */}
      </div>
    </Layout>
  );
};
```

#### Features

- **Collapsible Sidebar**: Sidebar is collapsed by default, showing only icons
- **Toggle Button**: Click the arrow button in the sidebar header to expand/collapse
- **Tooltips**: When collapsed, hover over navigation items to see tooltips
- **Responsive Design**: Automatically adapts to mobile devices
- **Smooth Animations**: Transitions between collapsed and expanded states

### Sidebar Component

The sidebar provides navigation between different pages of the application.

#### States

1. **Collapsed (Default)**: Shows only icons, width of 64px (4rem)
2. **Expanded**: Shows icons and labels, width of 256px (16rem)

#### Navigation Items

- Home (Products/POS)
- Drinks
- Orders
- Customers
- Reports
- Settings

#### Props

```tsx
interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}
```

### Page Structure

When creating new pages, follow this structure:

```tsx
import React from 'react';
import Layout from '../components/Layout';

interface MyPageProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const MyPage: React.FC<MyPageProps> = ({ currentPage, onPageChange }) => {
  return (
    <Layout currentPage={currentPage} onPageChange={onPageChange}>
      <div className="wepos-content-product">
        <div className="flex h-full flex-col">
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-bold text-gray-800">
              Page Title
            </h1>
            <p className="text-gray-600">Page description</p>
          </div>

          <div className="flex-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* Page content */}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MyPage;
```

### CSS Classes

Key CSS classes for the layout system:

- `.wepos-sidebar`: Main sidebar container
- `.wepos-sidebar.collapsed`: Collapsed state styles
- `.wepos-sidebar.expanded`: Expanded state styles
- `.wepos-sidebar-toggle`: Toggle button styles
- `.wepos-main-content`: Main content area wrapper
- `.wepos-content-product`: Individual page content container

### Responsive Behavior

- **Desktop**: Sidebar can be collapsed (64px) or expanded (256px)
- **Tablet**: Same as desktop but adjusted grid layouts
- **Mobile**: Sidebar becomes horizontal navigation bar

## Modal System

### WordPress Modal Components

All modals now use the official `@wordpress/components` Modal component for consistency with WordPress admin interface standards.

#### Usage

```tsx
import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const MyModal: React.FC = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <Modal
      title={__('Modal Title', 'wepos')}
      onRequestClose={onClose}
      className="my-modal-class"
      shouldCloseOnClickOutside={true}
      shouldCloseOnEsc={true}
      size="medium" // small, medium, large
    >
      <div className="modal-content">
        <p>{__('Modal content goes here', 'wepos')}</p>

        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose}>
            {__('Cancel', 'wepos')}
          </Button>
          <Button variant="primary" onClick={handleAction}>
            {__('Confirm', 'wepos')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
```

#### Modal Components

1. **HelpModal**: Keyboard shortcuts and help information
2. **PaymentModal**: Payment processing interface
3. **ReceiptModal**: Order receipt display

#### Features

- **Native WordPress Styling**: Consistent with WordPress admin
- **Accessibility**: Built-in ARIA labels and keyboard navigation
- **Responsive**: Automatically adapts to screen sizes
- **Customizable**: Support for different sizes and behaviors

## Internationalization (i18n)

### Translation Support

The application now uses `@wordpress/i18n` for complete translation support following WordPress standards.

#### Implementation

```tsx
import { __ } from '@wordpress/i18n';

// Simple translation
const title = __('Product Name', 'wepos');

// Translation with context
const buttonText = _x('Save', 'button label', 'wepos');

// Pluralization
const itemCount = _n('%d item', '%d items', count, 'wepos');

// Translation with sprintf
const message = sprintf(
  __('Order #%s created successfully', 'wepos'),
  orderNumber,
);
```

#### Text Domain

All translations use the `wepos` text domain:

- `__('Text to translate', 'wepos')`
- `_e('Text to echo', 'wepos')`
- `_x('Text', 'context', 'wepos')`

#### Translatable Strings

Key areas with translation support:

- **Modal titles and content**
- **Form labels and placeholders**
- **Button text and actions**
- **Error messages and notifications**
- **Table headers and data labels**
- **Accessibility labels (aria-label, title)**

#### Creating Translation Files

1. Extract translatable strings:

```bash
wp i18n make-pot . languages/wepos.pot --domain=wepos
```

2. Create language-specific files:

```bash
# For Spanish
languages/wepos-es_ES.po
languages/wepos-es_ES.mo
```

#### WordPress Integration

The translations integrate with WordPress's translation system:

- Language files stored in `/languages/` directory
- Follows WordPress translation standards
- Compatible with translation plugins (WPML, Polylang, etc.)
- Supports RTL languages
