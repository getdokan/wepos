import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
	Input,
	LabeledSwitch,
	SmartSelect,
	Switch,
	useSettings,
} from '@wedevs/plugin-ui';
import type { SettingsElement } from '@wedevs/plugin-ui';
import FieldRow from '../pages/pos-settings/fields/FieldRow';

declare const window: any;

interface CustomerResult {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
	username?: string;
}

const USE_GLOBAL = '__global__';

const getCustomerDisplayName = ( customer: CustomerResult ): string => {
	const fullName = `${ customer.first_name || '' } ${ customer.last_name || '' }`.trim();
	return fullName || customer.username || customer.email || '';
};

export interface DefaultCustomerFieldProps {
	/**
	 * Current customer id. Pass `null` to mean "use global" when rendered in
	 * an outlet/vendor context. `0` means "Guest Customer".
	 */
	value: number | null;
	/** Whether "Default Customer is Cashier" is on. Null means inherit-from-global. */
	isCashier: boolean | null;
	/**
	 * Fires when the user picks a customer. `null` is emitted only in outlet
	 * mode (i.e. when `allowUseGlobal` is true) to mean "clear the override".
	 */
	onChange: ( value: number | null, isCashier: boolean | null ) => void;
	/** Shows a "Use global setting" option at the top of the dropdown. */
	allowUseGlobal?: boolean;
	/** Custom label (defaults to "Default Customer"). */
	label?: string;
	/** Optional field description. */
	description?: string;
}

/**
 * Searchable customer selector paired with a "Default Customer is Cashier"
 * switch. Used in three places:
 *  - Admin global settings (allowUseGlobal=false)
 *  - Per-outlet settings     (allowUseGlobal=true)
 *  - Per-vendor (Dokan)      (allowUseGlobal=true)
 */
export const DefaultCustomerField: React.FC< DefaultCustomerFieldProps > = ( {
	value,
	isCashier,
	onChange,
	allowUseGlobal = false,
	label,
	description,
} ) => {
	const weposData = window.wepos || window.weposAdmin?.wepos || {};
	const currentUser = weposData.current_user || {};

	const [ customerOptions, setCustomerOptions ] = useState<
		{ value: string; label: string }[]
	>( [] );
	const [ loading, setLoading ] = useState( false );

	// Load the currently-selected customer's label (so the trigger doesn't show
	// a bare numeric ID) whenever the parent hands us a new value.
	useEffect( () => {
		if ( value === null || value === undefined || value <= 0 ) {
			return;
		}

		apiFetch< CustomerResult >( {
			path: `wc/v3/customers/${ value }`,
		} )
			.then( ( customer ) => {
				const labelText = getCustomerDisplayName( customer );
				setCustomerOptions( ( prev ) => {
					if ( prev.some( ( o ) => o.value === String( customer.id ) ) ) {
						return prev;
					}
					return [ { value: String( customer.id ), label: labelText }, ...prev ];
				} );
			} )
			.catch( () => {} );
	}, [ value ] );

	const handleSearch = useCallback( async ( query: string ) => {
		if ( ! query.trim() ) {
			setCustomerOptions( [] );
			return;
		}
		setLoading( true );
		try {
			const results = await apiFetch< CustomerResult[] >( {
				path: `wc/v3/customers?search=${ encodeURIComponent( query ) }&role=all`,
			} );
			setCustomerOptions(
				results.map( ( c ) => ( {
					value: String( c.id ),
					label: `${ getCustomerDisplayName( c ) } (${ c.email })`,
				} ) )
			);
		} catch {
			setCustomerOptions( [] );
		} finally {
			setLoading( false );
		}
	}, [] );

	const handleValueChange = ( v: string ) => {
		if ( allowUseGlobal && v === USE_GLOBAL ) {
			onChange( null, null );
			return;
		}
		const n = v ? Number( v ) : 0;
		onChange( n, isCashier === null ? false : isCashier );
	};

	const handleCashierToggle = ( checked: boolean ) => {
		// When cashier-mode flips on, clear any selected customer id.
		onChange( checked ? 0 : ( value ?? 0 ), checked );
	};

	// Build the option list. Dropdown order: (optional) Use global, Guest, matches.
	const options = [
		...( allowUseGlobal
			? [ { value: USE_GLOBAL, label: __( 'Use global setting', 'wepos' ) } ]
			: [] ),
		{ value: '0', label: __( 'Guest Customer', 'wepos' ) },
		...customerOptions,
	];

	const selectedValue =
		value === null || value === undefined
			? allowUseGlobal
				? USE_GLOBAL
				: '0'
			: String( value );

	// In cashier mode we lock the select and show the cashier name instead.
	const cashierName =
		`${ currentUser.first_name || '' } ${ currentUser.last_name || '' }`.trim() ||
		currentUser.name ||
		currentUser.username ||
		__( 'Cashier', 'wepos' );

	return (
		<Field>
			<FieldLabel>{ label || __( 'Default Customer', 'wepos' ) }</FieldLabel>
			<FieldContent>
				{ isCashier ? (
					<Input type="text" value={ cashierName } disabled />
				) : (
					<SmartSelect
						options={ options }
						value={ selectedValue }
						onValueChange={ handleValueChange }
						onSearch={ handleSearch }
						loading={ loading }
						placeholder={ __( 'Guest Customer', 'wepos' ) }
						searchPlaceholder={ __( 'Search customer…', 'wepos' ) }
						emptyMessage={ __( 'No customer found', 'wepos' ) }
						idleMessage={ __( 'Type to search…', 'wepos' ) }
						debounceMs={ 300 }
						className="w-full"
					/>
				) }

				<div className="mt-2">
					<LabeledSwitch
						checked={ isCashier === true }
						onCheckedChange={ handleCashierToggle }
						label={ __( 'Default Customer is Cashier', 'wepos' ) }
					/>
				</div>

				{ description ? (
					<FieldDescription>{ description }</FieldDescription>
				) : null }
			</FieldContent>
		</Field>
	);
};

const CUSTOMER_KEY = 'woo_general.default_customer';
const CASHIER_KEY = 'woo_general.default_customer_is_cashier';

interface RowProps {
	element: SettingsElement;
	// `registerVariant` forwards plugin-ui's fieldProps.onChange here; the
	// row components read/write via `useSettings().updateValue` so it's
	// unused, but the prop must match the shared FieldComponent signature.
	onChange: ( key: string, value: unknown ) => void;
}

/**
 * Customer picker row for the admin POS Settings → General tab.
 * Layout matches the sibling Currency field: label + description on the
 * left, control on the right (via `FieldRow`). Participates in plugin-ui's
 * save flow via `useSettings().updateValue`.
 *
 * When the cashier toggle is on, the SmartSelect is replaced with a
 * disabled input showing the logged-in user's name.
 */
export function DefaultCustomerSelectRow( { element }: RowProps ) {
	const { values, updateValue } = useSettings();
	const weposData = window.wepos || window.weposAdmin?.wepos || {};
	const currentUser = weposData.current_user || {};

	const rawCustomer = values[ CUSTOMER_KEY ];
	const rawCashier = values[ CASHIER_KEY ];
	const value = rawCustomer == null ? 0 : Number( rawCustomer ) || 0;
	const isCashier = rawCashier === 'yes' || rawCashier === true;

	const [ customerOptions, setCustomerOptions ] = useState<
		{ value: string; label: string }[]
	>( [] );
	const [ loading, setLoading ] = useState( false );

	useEffect( () => {
		if ( value <= 0 ) return;

		apiFetch< CustomerResult >( {
			path: `wc/v3/customers/${ value }`,
		} )
			.then( ( customer ) => {
				const labelText = getCustomerDisplayName( customer );
				setCustomerOptions( ( prev ) => {
					if ( prev.some( ( o ) => o.value === String( customer.id ) ) ) {
						return prev;
					}
					return [ { value: String( customer.id ), label: labelText }, ...prev ];
				} );
			} )
			.catch( () => {} );
	}, [ value ] );

	const handleSearch = useCallback( async ( query: string ) => {
		if ( ! query.trim() ) {
			setCustomerOptions( [] );
			return;
		}
		setLoading( true );
		try {
			const results = await apiFetch< CustomerResult[] >( {
				path: `wc/v3/customers?search=${ encodeURIComponent( query ) }&role=all`,
			} );
			setCustomerOptions(
				results.map( ( c ) => ( {
					value: String( c.id ),
					label: `${ getCustomerDisplayName( c ) } (${ c.email })`,
				} ) )
			);
		} catch {
			setCustomerOptions( [] );
		} finally {
			setLoading( false );
		}
	}, [] );

	const options = [
		{ value: '0', label: __( 'Guest Customer', 'wepos' ) },
		...customerOptions,
	];

	const cashierName =
		`${ currentUser.first_name || '' } ${ currentUser.last_name || '' }`.trim() ||
		currentUser.name ||
		currentUser.username ||
		__( 'Cashier', 'wepos' );

	return (
		<FieldRow element={ element }>
			<div className="max-w-56 md:max-w-full w-full">
				{ isCashier ? (
					<Input type="text" value={ cashierName } disabled />
				) : (
					<SmartSelect
						options={ options }
						value={ String( value ) }
						onValueChange={ ( v ) =>
							updateValue( CUSTOMER_KEY, v ? Number( v ) : 0 )
						}
						onSearch={ handleSearch }
						loading={ loading }
						placeholder={ __( 'Guest Customer', 'wepos' ) }
						searchPlaceholder={ __( 'Search customer…', 'wepos' ) }
						emptyMessage={ __( 'No customer found', 'wepos' ) }
						idleMessage={ __( 'Type to search…', 'wepos' ) }
						disabled={ !! element.disabled }
						debounceMs={ 300 }
						className="w-full"
					/>
				) }
			</div>
		</FieldRow>
	);
}

/**
 * "Default Customer is Cashier" toggle row. Same horizontal layout as
 * Currency — label + description on the left, switch on the right.
 * Flipping this on clears the selected customer id (stored as 0).
 */
export function DefaultCustomerCashierRow( { element }: RowProps ) {
	const { values, updateValue } = useSettings();
	const isCashier =
		values[ CASHIER_KEY ] === 'yes' || values[ CASHIER_KEY ] === true;

	const handleToggle = ( checked: boolean ) => {
		updateValue( CASHIER_KEY, checked ? 'yes' : 'no' );
		if ( checked ) {
			updateValue( CUSTOMER_KEY, 0 );
		}
	};

	return (
		<FieldRow element={ element }>
			<Switch
				checked={ isCashier }
				onCheckedChange={ handleToggle }
				disabled={ !! element.disabled }
			/>
		</FieldRow>
	);
}

export default DefaultCustomerField;
