=== wePOS - Point Of Sale (POS) for WooCommerce ===
Contributors: tareq1988, wedevs, nizamuddinbabu
Donate Link: http://tareq.co/donate/
Tags: WooCommerce POS, point of sale, free pos, pos plugin, woocommerce point of sale
Requires at least: 6.8
Tested up to: 6.9.4
WC requires at least: 10.5.0
WC tested up to: 10.7.0
Requires PHP: 7.4
Stable tag: 2.0.1
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

WooCommerce point of sale WordPress plugin.

== Description ==

= WooCommerce Point of Sales (POS) =
wePOS is a fast and responsive( Tablets & Desktop ) WooCommerce Point of Sales plugin. It lets you take orders and track your inventory using your WooCommerce store. You can physically count your WooCommerce products by scanning Bar codes and add them directly to customer’s cart for processing the order.

= Based of REST API =
wePOS is a single page application that works super fast. We have used WooCommerce REST API and some custom API to develop the plugin. This has made the plugin to response fast and gets your work done in time. In a physical store, you get a lot of customers who wait to checkout their products. So, a fast system like wePoS can be your one-way ticket to manage your inventory easily.

= Attractive User Interface =
A good UI can sometimes makes a system even more attractive. wePOS has an intuitive design that allows navigating easily. With it, you can manage your inventory and orders in an organized way.

= Shortcut / Hotkey Support =
wePOS has shortcut key support that lets you use its features faster. This is very important for any physical store so that the sales executive can read the Barcodes and process the orders with pace.

= Privacy Policy =
wePOS uses [Appsero](https://appsero.com) SDK to collect some telemetry data upon user's confirmation. This helps us to troubleshoot problems faster & make product improvements.

Appsero SDK **does not gather any data by default.** The SDK only starts gathering basic telemetry data **when a user allows it via the admin notice**. We collect the data to ensure great user experience for all our users.

Integrating Appsero SDK **DOES NOT IMMEDIATELY** start gathering data, **without confirmation from users in any case.**

= Contribute =
This may have bugs and lack of many features. If you want to contribute on this project, you are more than welcome. Please fork the repository from [Github](https://github.com/weDevsOfficial/wepos).

= Author =
Brought to you by [weDevs](http://wedevs.com)

== Installation ==

Extract the zip file and just drop the contents in the wp-content/plugins/ directory of your WordPress installation and then activate the Plugin from Plugins page.

== Frequently Asked Questions ==
No FAQ

== Screenshots ==
1. Intuitive POS
2. Quicker Product List View
3. Light/Dark Theme
4. On The Fly Discount Calculation
5. Intuitive Checkout

== Changelog ==

= v2.0.1 ( May 21, 2026 ) =
- **fix:** Tax breakdown (per-line tax, subtotal "Including Tax" hint, and total tax row) is now displayed in the new POS cart UI.
- **fix:** Order totals saved on the server now match the cart total when WooCommerce "Prices entered with tax" and "Display prices in cart" settings differ.
- **fix:** Per-row tax on sale-priced products now reports the correct amount for both the regular and sale prices.

= v2.0.0 ( April 27, 2026 ) =
- **new:** A brand new wePOS — the entire cashier screen and the admin settings have been rebuilt from scratch, so everything feels faster and more responsive.
- **new:** A refreshed look and feel — buttons, popups, dropdowns, forms, and tables all share a cleaner, more modern design.
- **new:** Light, Dark, and System (matches your device) display modes, with a smooth fade when you switch between them.
- **new:** wePOS now keeps its own styling separate from your WordPress theme and other plugins, so the screen no longer breaks if another plugin loads conflicting styles.
- **new:** A new Appearance setting lets you switch between the new design and the old design at any time, so you can move at your own pace.
- **new:** wePOS now works with the Dokan multivendor plugin — if your store has multiple Dokan vendors, each vendor can run their own POS with their own products, customers, and orders, without needing the site admin for daily sales.
- **new:** Dokan vendor staff can sit at the counter and use wePOS — they automatically get the right access from their vendor, so you don't need to set permissions one by one.
- **new:** When a Dokan vendor (or their staff) is signed in, they only see their own products, customers, and orders — never another vendor's data.
- **new:** You can now choose a default customer for new sales at the site level, and each Dokan vendor can override it with their own preferred default.
- **new:** Voiding (discarding) an active cart now asks for confirmation, so you don't lose a sale by accident.
- **new:** You can now use the keyboard arrow keys to pick a customer during checkout — faster than clicking.
- **new:** Customer search now shows phone number and company name, making it easier to find the right person.
- **new:** Products with fractional quantities (for example 1.5 kg) are now supported, and you can hide individual products from the POS while keeping them on your online store.
- **new:** Shipping tax is now correctly included on receipts and in the order total.
- **new:** Prices now follow the thousand-separator style you set in WooCommerce (for example 1,000.00 vs 1.000,00).
- **new:** New "Restore defaults" buttons across currency, tax, and POS settings, including for individual sections, in case you want to undo your changes.
- **new:** New extension points for developers to add their own buttons and panels to the POS screen.
- **fix:** The stock count is no longer updated when nothing actually changed.
- **fix:** Cart quantities are now rounded cleanly so you don't see numbers like "1.0000000002".
- **fix:** Old orders that were saved with fractional quantities now display correctly.
- **fix:** If an order was already deleted on the server, updating or deleting it again no longer throws an error — it's handled silently.
- **fix:** The default customer setting is now visible and editable from inside the Dokan vendor dashboard.
- **fix:** Fixed a styling clash where Dokan's CSS was breaking the look of wePOS admin pages.
- **fix:** Customer creation and permission checks have been corrected for non-admin users.
- **fix:** Printing a receipt now waits until the receipt is fully drawn before sending it to the printer, so you no longer get blank or half-printed receipts.
- **fix:** The cart icon badge (the little number) is now positioned correctly.
- **fix:** When no customer is selected, the order is now sent to WooCommerce with empty address fields instead of stale data from a previous customer.

= v1.3.3 ( September 11, 2025 ) =
- **fix:** Product search results were showing in reverse order (Z → A). Updated to sort ascending (A → Z).
- **fix:** Alerts were missing sometimes on payment or order processing errors. Now error messages are handled safely (using optional chaining) and a fallback localized message is shown if the error message is unavailable.
- **feature:** Introduce new Vue filter hooks (`wepos_global_top`, `wepos_after_payment_content`, `wepos_after_payment_buttons`) to allow extensions to inject custom UI.

= v1.3.1 ( June 20, 2025 ) =
- **feat**: Added `refund` support for card payment method.
- **update**: Added High Performance Order Storage support.
- **update**: Product price included in the frontend POS grid layout.
- **update**: Optimized customer create form on POS home screen.
- **fix:** Resolved an issue where search wasn't working on product categories dropdown.
- **fix:** Resolved an issue of creating orders for existing customers without billing email.
- **fix:** Resolved an issue where the general section under admin settings wasn't expanding by default after activating wePOS Pro.
- **fix:** Resolved an issue of inconsistency in print receipt.

= v1.3.0 ( January 10, 2025 ) =
- **Fix:** POS discount coupons were accessible from single order page on admin dashboard
- **Compatibility:** Compatibility for WordPress 6.7
- **Chore:** Update Appsero client for WP 6.7 compatibility

= v1.2.8 ( June 5, 2024 ) =
- **Feature:** WooCommerce Coupon API integration for cart discount
- **Enhancement:** Added support for WooCommerce customised order numbers by third-party plugins
- **Fix:** Blurry numbers on print receipt

= v1.2.7 ( December 27, 2023 ) =
- **Enhancement:** Tax calculation implementation based on discounts and fees instead of base price of products

= v1.2.6 ( December 30, 2022 ) =
- **New:** Integrated Vue date range picker, select2 and Vue chart JS packages
- **New:** Added helper methods for getting day JS and date range picker date formats
- **New:** Added helper method for getting custom date ranges
- **Refactor:** Order created via wePOS setter

= v1.2.5 ( November 1, 2022 ) =
- **Feature:** "View POS" menu on "My Account" page
- **Enhancement:** Added all decimal separator support as per wooCommerce settings to put a discount or adding a fee from POS frontend
- **Enhancement:** Updated webpack to v5
- **Fix:** Broken layout on smaller width print receipt
- **Fix:** Variable product visible on POS frontend even no attributes used
- **Chore:** Variable replace automation

= v1.2.4 ( June 28, 2022 ) =
- **Fix:** Localization issue on changing site language

= v1.2.3 ( June 3, 2022 ) =
- **Compatibility:** Compatibility for WordPress 6.0

= v1.2.2 ( May 19, 2022 ) =
- **Enhancement:** Added keyboard accessibility support to the payment and print receipt options
- **Fix:** Scrollbar broken style issue on frontend view
- **Fix:** Customer selection dropdown selecting wrong customer by pressing enter/return key on frontend
- **Fix:** Pressing enter/return key results product addition to the cart, even the product search dropdown closed on frontend

= v1.2.1 ( March 15, 2022 ) =
- **Feat:** Remote promotion notice

= v1.2.0 ( January 27, 2022 ) =
- **Compatibility:** Compatibility for WordPress 5.9
- **Fix:** Fixed an issue where wePOS frontend is not loading

= v1.1.12 ( December 31, 2021 ) =
- **Feature:** Stock support for the pos product, out-of-stock products will be shown but can not be added into the cart

- **Enhancement:** Codebase optimization & various page i18n support

- **Fix:** Z index mismatch for components, some components were not displaying properly with modal
- **Fix:** Variation product's all variations can not be seen
- **Fix:** Variation products attributes UX issue
- **Fix:** Double payment can be done by double-clicking the process payment button
- **Fix:** You already logged in to any other counter or outlet
- **Fix:** Product images not shown on POS

= v1.1.11 ( November 19, 2021 ) =

- **Fix:** PSR-4 class autoloading for Admin namespace

= v1.1.10 ( November 19, 2021 ) =

- **Feature:** Admin dependency notice for WooCommerce
- **Feature:** Support for other decimal separator character

- **Enhancement:** Black friday 2021 promotion
- **Enhancement:** Tab view responsiveness support for POS cart content
- **Enhancement:** Support for Composer 2
- **Enhancement:** Codebase optimization and restructure

- **Fix:** The price rounding does not work for discounts
- **Fix:** Fixed an issue where POS admin panel does not have the correct font family
- **Fix:** Thermal printer text is unclear for receipt
- **Fix:** Product Tax is not showing properly on the receipt
- **Fix:** NPM vulnerabilities

= v1.1.8 ( October 19, 2021 ) =

- **Enhancement:** Added halloween sale 2021 limited promotion banner

= v1.1.7 ( July 13, 2021 ) =

- **Enhancement:** Added summer sale 2021 limited promotion banner

= v1.1.6 ( May 8, 2021 ) =

- **Enhancement:** Added limited promotion banner

= v1.1.5 ( March 15, 2021 ) =

- **Enhancement:** Added limited promotion banner

= v1.1.4 ( December 21, 2020 ) =

- **Enhancement:** Added limited promotion banner

= v1.1.3 ( November 23, 2020 ) =

- **Enhancement:** Added limited promotion banner

= v1.1.2 ( October 28, 2020 ) =
- **Fix:** Permission callback warnings
- **Fix:** Duplicate order get generated if pay now button pressed twice while doing payment.
- **Fix:** While Dokan installed, login was redirecting back to account page.
- **Feature:** Cash input checking and Validation for Cash payment
- **Feature:** Cart data validation for payment for currently active cart tab
- **Feature:** Dynamic Pay now button based on current cart tab

= v1.1.1 ( December 23, 2019 ) =
- **Tweak**  Appser client updated

= v1.1.0 ( December 9, 2019 ) =
- **Tweak**  Update some styling issues
- **Tweak**  Added appsero client
- **Fix**    Undefined customer_id error fixed

= v1.0.9 ( September 25, 2019 ) =
- **Fix**   Tax calculation issue in pos cart
- **Fix**   Fee tax not calculated when manually added in pos cart

= v1.0.8 ( August 22, 2019 ) =
- **Fix**   Variation REST api rendering issue
- **Fix**   Gateway class not loaded if WooCommerce deactivate

= v1.0.7 ( July 26, 2019 ) =
- **Fix**   Category rendering issue fixed
- **Fix**   Thausand and decimal separetor issue fixed
- **Tweak** Add vuex support for better performance

= v1.0.6 ( June 17, 2019 ) =
- **Fix**   Remove deleted product from saved cart items when product is already deleted
- **Fix**   Admin bar conflicted with dokan plugin fixed
- **Fix**   Translation issue fixed
- **Tweak** Added some filter and hooks for extends future functionalites

= v1.0.5 ( May 17, 2019 ) =
- **Fix**   Customer not created if WooCommerce default `Automatic username and passowrd create` options is changed
- **Fix**   Customer creating and serching issue for Dokan vendors
- **Fix**   Stock level manage during cart and checkout process
- **Fix**   Tax not displaying when exclusive tax applied from WooCommerce settings
- **Tweak** Move product api endpoints to wepos custom endpoint
- **Tweak** Remove some unwanted code

= v1.0.4 ( May 3, 2019 ) =
- **New**   Added extra column in order listing page for determining whether the order is POS order or not
- **Fix**   Cash gateway payment processing issues
- **Fix**   Customer not created if woocommerce default account creatation option is disabled
- **Tweak** Added updater class for changing some meta's
- **Tweak** Update some flaticons
- **Tweak** Added some core filters in js end for extending components

= v1.0.3 ( April 8, 2019 ) =
- **Fix**   Undefined issue in admin settings page
- **Tweak** Remove some unwnated code
- **Tweak** Modal component load globally and add more customizable options
- **Tweak** Update some flaticons

= v1.0.2 ( March 25, 2019 ) =
- **New**   Added billing address missing fields in customer create
- **New**   Added all category selection in category filter
- **New**   Add extra product info in product list view
- **New**   Add Dokan plugin support
- **Tweak** Change quick menu layout to popover
- **Tweak** Change routing and menu rendring system for future extends
- **Fix**   Case sensitive issue in product search
- **Fix**   Remove attributes for simple product in cart and payment page
- **Fix**   Cursor poiting issue in keypads and other buttons
- **Fix**   Fee and discount calculation issue large amount(Price) of products
- **Fix**   Tax and fee tax calculation problem for percentage fees
- **Fix**   Product thumbnail resolution issue
- **Fix**   Rounding problem in cash and change amount after payment

= v1.0.1 ( March 4, 2019 ) =
- **Fix**    Product fetching issue when no products found
- **Fix**    Customer data not reset during empty cart or new sales
- **Fix**    Event bus not triggering properly
- **Fix**    Render only publishable product in pos system
- **Tweak**  Added wp hooks for load action and filters

= v1.0.0 ( February 22, 2019 ) =
Initial version released

== Upgrade Notice ==
= 1.3.0 =
If you have wePos Pro installed, please ensure it is updated to version 1.2.1 or later before upgrading to this version.
