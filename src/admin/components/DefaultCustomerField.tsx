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
	toast,
	Button,
} from '@wedevs/plugin-ui';
import { LoaderCircle, Save } from 'lucide-react';

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

/**
 * A self-contained version that loads its own value from `/wepos/v1/settings`
 * and saves back via POST. Used in the admin Settings page, where the field
 * needs to persist independently of the rest of the schema-driven form.
 */
export const GlobalDefaultCustomerField: React.FC = () => {
	const [ value, setValue ] = useState< number >( 0 );
	const [ isCashier, setIsCashier ] = useState< boolean >( false );
	const [ loading, setLoading ] = useState( true );
	const [ saving, setSaving ] = useState( false );
	const [ dirty, setDirty ] = useState( false );

	useEffect( () => {
		apiFetch< any >( { path: '/wepos/v1/settings' } )
			.then( ( res ) => {
				const g = res?.woo_general || {};
				setValue( Number( g.default_customer ) || 0 );
				setIsCashier( g.default_customer_is_cashier === 'yes' );
			} )
			.catch( () => {} )
			.finally( () => setLoading( false ) );
	}, [] );

	const handleChange = ( v: number | null, cashier: boolean | null ) => {
		setValue( v === null ? 0 : v );
		setIsCashier( cashier === null ? false : cashier );
		setDirty( true );
	};

	const handleSave = async () => {
		setSaving( true );
		try {
			await apiFetch( {
				path: '/wepos/v1/settings',
				method: 'POST',
				data: {
					woo_general: {
						default_customer: value,
						default_customer_is_cashier: isCashier ? 'yes' : 'no',
					},
				},
			} );
			toast.success( __( 'Default customer saved.', 'wepos' ) );
			setDirty( false );
		} catch {
			toast.error( __( 'Failed to save default customer.', 'wepos' ) );
		} finally {
			setSaving( false );
		}
	};

	if ( loading ) {
		return (
			<div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
				<LoaderCircle className="size-4 animate-spin" />
				{ __( 'Loading default customer…', 'wepos' ) }
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<DefaultCustomerField
				value={ value }
				isCashier={ isCashier }
				onChange={ handleChange }
				description={ __(
					'Customer assigned to new POS orders when no customer is selected. Per-outlet overrides take precedence.',
					'wepos'
				) }
			/>
			<div>
				<Button onClick={ handleSave } disabled={ ! dirty || saving }>
					{ saving ? (
						<LoaderCircle className="size-4 mr-2 animate-spin" />
					) : (
						<Save className="size-4 mr-2" />
					) }
					{ __( 'Save Default Customer', 'wepos' ) }
				</Button>
			</div>
		</div>
	);
};

export default DefaultCustomerField;
