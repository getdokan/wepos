# wePOS Settings Revamp — Plan v3

## Pivot from v2
- Admin-side **General** subpage stays unchanged (its fields continue to live in `wepos_general`).
- **POS Settings** is a new subpage built with the **`@wedevs/plugin-ui` `Settings` schema renderer**, adding custom field variants via `addFilter("wepos_settings_{variant}_field", ...)` (the extensibility pattern documented in plugin-ui's `Settings.mdx`). No hand-rolled Tabs UI.
- Vendor dashboard gets a matching **POS Settings** page (same schema, via same bundle) plus a new **POS Access** page for managing staff/cashier permissions.

## Architecture assumptions

- **WooCommerce + wePOS (no Dokan)** — admin = one store, one POS. All saves global.
- **WooCommerce + Dokan + wePOS** — each vendor = one store, one POS. Vendor saves go to vendor user meta; global WC options stay untouched. Admin still controls role-level capability baseline.

## Admin panel structure (3 subpages)

```
wePOS → Settings
├── General                (UNCHANGED)
│     └── wepos_general fields: POS Layout, Fee Tax, Barcode Scanner Field
├── Receipts               (UNCHANGED)
├── Access                 (EXTENDED — adds Settings cap group)
└── POS Settings           (NEW subpage, schema-driven)
      ├── Tab: General     — store info, country, address, currency, default customer
      ├── Tab: Tax         — WC tax config + enable_fee_tax
      └── Tab: Barcode     — prefix, suffix, averageTimeThreshold, minimumLength
```

## Vendor dashboard structure (Dokan active)

```
Vendor Dashboard → wePos
├── View POS                (existing lite)
├── POS Settings            (NEW — core; pro's pos/settings stays for outlet-aware flows)
└── POS Access              (NEW — core; staff/cashier perms matrix)
```

If wepos-pro is active, its `pos/settings` page (outlet-aware) takes precedence and core's `pos-settings` page is suppressed — only `pos-access` is mounted by core.

## Data scope

| Section key | Admin scope | Vendor scope | Outlet scope (pro) | Personal (user meta) |
|---|---|---|---|---|
| `woo_general`   | `blogname` + `woocommerce_*` options | `_wepos_vendor_settings` | `_wepos_outlet_settings_{id}` | — |
| `woo_tax`       | `woocommerce_*_tax*` options | vendor meta | outlet meta | — |
| `wepos_general` | `wepos_general` option | vendor meta | outlet meta | — |
| `wepos_barcode` | `wepos_barcode` option | vendor meta | outlet meta | — |
| `wepos_receipts`| `wepos_receipts` option | — | — | — |
| `wepos_cashier` | — | — | — | `_wepos_cashier_settings` |
| `wepos_theme`   | — | — | — | `_wepos_theme_settings` |

Read merge precedence: `global → vendor → outlet`. Personal sections are always user-meta, independent.

## Capability matrix defaults

| Cap | admin | shop_manager | cashier | seller (dokandar) | vendor_staff |
|---|---|---|---|---|---|
| access_wepos | ✓ (locked) | ✓ | ✓ | ✓ | off |
| manage_wepos | ✓ (locked) | ✓ | off | ✓ | off |
| view_general_settings | ✓ (locked) | ✓ | off | ✓ | off |
| edit_general_settings | ✓ (locked) | ✓ | off | ✓ | off |
| view_tax_settings | ✓ (locked) | ✓ | off | ✓ | off |
| edit_tax_settings | ✓ (locked) | ✓ | off | ✓ | off |
| view_barcode_settings | ✓ (locked) | ✓ | off | ✓ | off |
| edit_barcode_settings | ✓ (locked) | ✓ | off | ✓ | off |

Vendor cascade enforced by `Settings\Caps`:
```
effective_access_pos(u) = user_cap AND parent_vendor_access_pos(u)
effective_view_X(u)     = user_cap AND effective_access_pos(u)
effective_edit_X(u)     = user_cap AND effective_manage_pos(u)
```
`parent_vendor` of a `vendor_staff` comes from `_vendor_id` meta (via `wepos_resolve_vendor_id`).

## POS Settings schema — built with plugin-ui

Subpage with 3 tabs. Each tab owns one REST section. Save handler posts `{ [section_id]: flatValues }` to `/wepos/v1/settings` — section dropped if user lacks `edit_*` cap.

### General tab (section: `woo_general`)
- `store_name` — text
- `store_address` — text
- `store_address_2` — text
- `store_city` — text
- `store_postcode` — text
- `default_country` — **custom variant `country_state`** (dependent dropdown, US:CA format)
- `default_customer` — **custom variant `customer_search`** (async SmartSelect via WC REST `/wc/v3/customers?search=`)
- `default_customer_is_cashier` — switch
- `currency` — **custom variant `currency_select`** (label `Name (SYMBOL)`)
- `currency_pos` — select
- `price_decimal_sep` — text
- `price_thousand_sep` — text
- `price_num_decimals` — number
- `thousands_group_style` — select

### Tax tab (section: `woo_tax`)
- `wc_tax_enabled` — switch
- `wc_prices_include_tax` — switch
- `wc_tax_based_on` — select (Shipping / Billing / Base)
- `wc_shipping_tax_class` — select (tax class list — **custom variant `tax_class_select`** sourced from `settings.tax_classes`)
- `wc_tax_round_at_subtotal` — switch
- `wc_tax_total_display` — radio_capsule
- `enable_fee_tax` — switch

### Barcode tab (section: `wepos_barcode`)
- `prefix` — text
- `suffix` — text
- `averageTimeThreshold` — number (min 1)
- `minimumLength` — number (min 1)

## Custom field registration pattern

Following plugin-ui docs, each custom variant is registered once at app bootstrap:

```ts
import { addFilter } from '@wordpress/hooks';

addFilter('wepos_settings_country_state_field', 'wepos/country-state',
  (element, fieldData) => <CountryStateField data={fieldData} />
);

addFilter('wepos_settings_customer_search_field', 'wepos/customer-search',
  (element, fieldData) => <CustomerSearchField data={fieldData} />
);

addFilter('wepos_settings_currency_select_field', 'wepos/currency-select',
  (element, fieldData) => <CurrencySelectField data={fieldData} />
);

addFilter('wepos_settings_tax_class_select_field', 'wepos/tax-class-select',
  (element, fieldData) => <TaxClassSelectField data={fieldData} />
);
```

The `<Settings>` wrapper in `Settings.tsx` / POS Settings page receives `applyFilters` + `hookPrefix="wepos"` so these filter names fire.

## REST contract

`GET /wepos/v1/settings?outlet_id={id?}` — merged settings + reference data (already works):
```json
{
  "woo_general":   { ... },
  "woo_tax":       { ... },
  "wepos_general": { ... },
  "wepos_barcode": { ... },
  "wepos_receipts":{ ... },
  "wepos_cashier": { ... },
  "wepos_theme":   { ... },
  "currencies":    { "USD": { "name": "US Dollar", "symbol": "$" }, ... },
  "tax_classes":   [ { "slug": "standard", "name": "Standard" }, ... ],
  "outlets":       [ ... ]
}
```

Sections gated by per-user `view_*` cap (reference data always returned).

`POST /wepos/v1/settings` — `{ section_id: { field: value }, _outlet_id?: number }`.
Each section gated by `edit_*`. Personal sections route to user meta regardless of outlet_id.

Vendor-dashboard staff access is handled as a plain PHP form POST (no REST round-trip) — the page posts back to itself, `wepos_pos_access_nonce` guards the request, and `add_cap` / `remove_cap` run inside `Dokan::handle_pos_access_submit()`. Dropped the REST endpoint because the page doesn't need client-side interactivity beyond checkboxes.

## File changes

### Keep (from prior passes)
- `includes/Settings/Caps.php` — section-level + cascade helpers
- `includes/REST/SettingController.php` — section gating, personal meta, `wepos_barcode` overridable
- `includes/REST/AccessController.php` — settings cap group, Dokan roles
- `includes/Installer.php` — default caps
- `includes/Dokan.php` — vendor overlay/save, profile sync, staff matrix hooks
- `src/frontend/hooks/useBarcodeSettings.ts` / `useCartSettings.ts` / `useThemeSettings.ts`

### Revert
- `includes/functions.php` → restore original `wepos_get_settings_sections()` + `wepos_get_settings_fields()` (3 sections). Drop the flat woo_* fields from the admin schema — they're REST-only and rendered by the custom POS Settings subpage.
- `src/admin/pages/Settings.tsx` → drop flat woo_* field mapping from `buildStandardSchema`. Standard subpages: General + Receipts + Access only. Access still gets the Settings cap group.

### New
- `src/admin/pages/pos-settings/schema.ts` — schema builder returning `SettingsElement[]` for the POS Settings subpage (`page → subpage → tab → section → field` hierarchy). Field keys are dot-namespaced (`woo_general.store_name`) so saves group by section.
- `src/admin/pages/pos-settings/index.tsx` — loads `/wepos/v1/settings`, renders `<Settings>` with schema + `hookPrefix="wepos"` + `applyFilters`, saves grouped payload.
- `src/admin/pages/pos-settings/reference-data.ts` — React context for `currencies` / `tax_classes` so field components can consume without re-fetching.
- `src/admin/pages/pos-settings/fields/CountryStateField.tsx` — dependent dropdown (reads `window.weposAdmin.countries` / `states`).
- `src/admin/pages/pos-settings/fields/CustomerSearchField.tsx` — async SmartSelect via WC REST.
- `src/admin/pages/pos-settings/fields/CurrencySelectField.tsx` — formatted label select from reference-data context.
- `src/admin/pages/pos-settings/fields/TaxClassSelectField.tsx` — tax class select from reference-data context.
- `src/admin/pages/pos-settings/register.ts` — registers the four custom variants via `addFilter("wepos_settings_{variant}_field", ...)`.
- `src/admin/App.tsx` — register `/pos-settings` route + page_key `pos_settings`.
- `includes/Admin/Admin.php` — add POS Settings submenu entry.
- `includes/Admin/Dashboard.php` — localize `countries` + `states` into `weposAdmin`.
- `includes/Installer.php` — include `wepos_page_pos_settings` in default page caps.
- `includes/REST/AccessController.php` — include `wepos_page_pos_settings` in the access matrix.
- `includes/Dokan.php` — add `POS Access` submenu + `pos/access` query var + template renderer + save handler + `get_vendor_pos_users()`.
- `templates/dokan/pos-access.php` (NEW) — server-rendered vendor dashboard POS Access page (pure PHP form, no React bundle required).

## Verification

**Admin**
- [ ] wePOS → Settings shows General / Receipts / Access subpages with pre-revamp fields intact.
- [ ] wePOS → POS Settings shows General / Tax / Barcode tabs (schema-rendered, plugin-ui).
- [ ] Country → state dropdown updates in real time.
- [ ] Customer search populates async via WC REST.
- [ ] Saving General → `blogname` + `woocommerce_*` options updated.
- [ ] Saving Tax → `woocommerce_calc_taxes` etc. updated.
- [ ] Saving Barcode → `wepos_barcode` option updated.
- [ ] Access → new Settings group with 6 caps per role.

**POS (cashier)**
- [ ] Theme + cashier settings persist across devices (user meta).
- [ ] Legacy localStorage values migrated once, then cleared.

**Vendor dashboard (Dokan)**
- [ ] wePos → POS Access page lists vendor's staff + cashiers.
- [ ] Toggling access_wepos / manage_wepos persists via REST + add_cap/remove_cap.
- [ ] When admin disables vendor's access_wepos, staff toggles disabled + cascade banner shows.
- [ ] When pro absent: wePos → POS Settings page renders the same schema, saves to `_wepos_vendor_settings`.
- [ ] `dokan_profile_settings` kept in sync when vendor saves General (store info).

**Regression**
- [ ] Admin General subpage (POS Layout + Fee Tax + Barcode field) renders and saves identically.
- [ ] Receipts subpage unchanged.
- [ ] Pro's outlet-aware POS settings page continues to work (untouched).

## Out of scope
- Vendor dashboard outlet CRUD (pro).
- Renaming cap symbols — labels only (Access POS / Manage POS).
- Network / multisite.
