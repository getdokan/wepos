import { addFilter } from '@wordpress/hooks';
import { createElement } from '@wordpress/element';
import type { ReactElement } from 'react';
import type { SettingsElement } from '@wedevs/plugin-ui';
import CountryStateField from './fields/CountryStateField';
import CustomerSearchField from './fields/CustomerSearchField';
import CurrencySelectField from './fields/CurrencySelectField';
import TaxClassSelectField from './fields/TaxClassSelectField';

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
