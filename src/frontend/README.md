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
const response = await apiFetch({
  path: `/${window.wepos.rest.posversion}/products?status=publish&per_page=30&page=${page}`
}) as Product[];
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
npm run react:start

# Production build (React)  
npm run react:build

# Development build (Vue.js - legacy)
npm run dev:build

# Production build (Vue.js - legacy)
npm run build

# Watch mode for development (Vue.js - legacy)
npm run dev
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

**Build Issues:**
- Use `npm run react:build` for React frontend (not `npm run build`)
- Use `npm run react:start` for development mode

### Debug Information
- Console logs show order payload structure before submission
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
    data: orderPayload
  });

  // Step 2: Process payment
  const paymentResponse = await apiFetch({
    path: `/${window.wepos.rest.posversion}/payment/process`,
    method: 'POST',
    data: orderResponse
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
    { key: '_wepos_cash_change_amount', value: changeAmount }
  ]
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
