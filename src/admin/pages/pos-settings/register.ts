import { addFilter } from '@wordpress/hooks';
import { createElement } from '@wordpress/element';
import type { ReactElement } from 'react';
import type { SettingsElement } from '@wedevs/plugin-ui';
import CountryStateField from './fields/CountryStateField';
import CustomerSearchField from './fields/CustomerSearchField';
import CurrencySelectField from './fields/CurrencySelectField';
import TaxClassSelectField from './fields/TaxClassSelectField';
import {
	DefaultCustomerCashierRow,
	DefaultCustomerSelectRow,
} from '../../components/DefaultCustomerField';

interface FieldRenderArgs {
	element: SettingsElement;
	onChange: ( key: string, value: unknown ) => void;
}

type FieldComponent = (
	props: FieldRenderArgs
) => ReactElement;

/**
 * Register wepos custom settings field variants with plugin-ui.
 *
 * Filters fire as `wepos_settings_{variant}_field`. Only this module's variants
 * are intercepted — all other variants pass through the default element.
 */
export function registerPosSettingsFields() {
	registerVariant( 'country_state', CountryStateField );
	registerVariant( 'customer_search', CustomerSearchField );
	registerVariant( 'currency_select', CurrencySelectField );
	registerVariant( 'tax_class_select', TaxClassSelectField );
	// Paired fields for the "General Configuration" section. Both row
	// components read/write via `useSettings()` — they ignore the onChange
	// arg that `registerVariant` forwards, so registering them through the
	// same helper is harmless. Done here (rather than in Settings.tsx)
	// so the Dokan vendor POS Settings page — which imports and calls
	// `registerPosSettingsFields` from `@wepos/components` — also picks
	// them up. Without this, the variants fall through to plugin-ui's
	// "Unsupported field type" fallback in the vendor UI.
	registerVariant( 'default_customer', DefaultCustomerSelectRow );
	registerVariant( 'default_customer_cashier', DefaultCustomerCashierRow );
}

function registerVariant( variant: string, Component: FieldComponent ) {
	addFilter(
		`wepos_settings_${ variant }_field`,
		`wepos/pos-settings/${ variant }`,
		(
			defaultElement: ReactElement,
			mergedElement: SettingsElement & {
				onChange?: ( key: string, value: unknown ) => void;
			}
		) => {
			// plugin-ui passes the fully-merged element (value included) as the
			// second filter arg, but the onChange callback is bound inside the
			// default element. We pull it via a thin wrapper component that
			// reads from the FieldComponentProps via context if needed — here
			// we simply re-use the default element's onChange by cloning.
			const defaultProps = ( defaultElement as any )?.props || {};
			const onChange =
				defaultProps.onChange ||
				( ( _k: string, _v: unknown ) => {} );

			return createElement( Component, {
				element: mergedElement,
				onChange,
			} );
		}
	);
}
