import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	SmartSelect,
	type SmartSelectOption,
	RadioGroup,
	RadioCard,
} from '@wedevs/plugin-ui';
import { Store, ShieldCheck } from 'lucide-react';
import apiFetch from '@wordpress/api-fetch';

interface VendorSearchProps {
	vendorId?: number;
	vendorStoreName?: string;
	onVendorChange: ( vendorId: number ) => void;
}

type Ownership = 'admin' | 'vendor';

const VendorSearch = ( { vendorId, vendorStoreName, onVendorChange }: VendorSearchProps ) => {
	const initialOwnership: Ownership = vendorId && vendorId > 0 ? 'vendor' : 'admin';

	const [ ownership, setOwnership ] = useState< Ownership >( initialOwnership );
	const [ searchResults, setSearchResults ] = useState< SmartSelectOption[] >( [] );
	const [ selectedVendor, setSelectedVendor ] = useState< SmartSelectOption | null >(
		vendorId && vendorId > 0
			? {
				value: String( vendorId ),
				label: vendorStoreName || `Vendor #${ vendorId }`,
			}
			: null,
	);
	const [ loading, setLoading ] = useState( false );

	// Always include selected vendor in options so the trigger label stays visible.
	const options = useMemo( () => {
		if ( ! selectedVendor ) return searchResults;
		if ( searchResults.some( ( o ) => o.value === selectedVendor.value ) ) return searchResults;
		return [ selectedVendor, ...searchResults ];
	}, [ searchResults, selectedVendor ] );

	const handleSearch = useCallback( async ( query: string ) => {
		if ( query.length < 2 ) {
			setSearchResults( [] );
			return;
		}

		setLoading( true );
		try {
			const results = await apiFetch< any[] >( {
				path: `dokan/v1/stores?search=${ encodeURIComponent( query ) }&per_page=10`,
			} );
			setSearchResults(
				results.map( ( v: any ) => ( {
					value: String( v.id ),
					label: v.store_name || v.name || `Vendor #${ v.id }`,
					description: v.email || undefined,
				} ) ),
			);
		} catch {
			setSearchResults( [] );
		} finally {
			setLoading( false );
		}
	}, [] );

	const handleValueChange = useCallback(
		( val: string ) => {
			if ( val ) {
				const opt = options.find( ( o ) => o.value === val );
				if ( opt ) setSelectedVendor( opt );
				onVendorChange( Number( val ) );
			} else {
				setSelectedVendor( null );
				onVendorChange( 0 );
			}
		},
		[ options, onVendorChange ],
	);

	const handleOwnershipChange = useCallback(
		( next: string ) => {
			const value = next as Ownership;
			setOwnership( value );
			if ( value === 'admin' ) {
				setSelectedVendor( null );
				onVendorChange( 0 );
			}
		},
		[ onVendorChange ],
	);

	// Keep selectedVendor label in sync when the outlet prop changes (edit flow).
	useEffect( () => {
		if ( ! vendorId || vendorId === 0 ) {
			setSelectedVendor( null );
			setOwnership( 'admin' );
			return;
		}

		setOwnership( 'vendor' );

		// Already loaded — nothing to do.
		if ( selectedVendor?.value === String( vendorId ) ) return;

		// Seed from vendor_store_name immediately so field is never blank.
		const seededLabel = vendorStoreName || `Vendor #${ vendorId }`;
		setSelectedVendor( {
			value: String( vendorId ),
			label: seededLabel,
		} );

		// Enrich with email in background; ignore failures — label already set.
		apiFetch< any >( { path: `dokan/v1/stores/${ vendorId }` } )
			.then( ( v ) => {
				setSelectedVendor( {
					value: String( v.id ),
					label: v.store_name || v.name || seededLabel,
					description: v.email || undefined,
				} );
			} )
			.catch( () => {} );
	}, [ vendorId, vendorStoreName ] );

	return (
		<div className="py-4">
			<div className="flex items-center gap-3 mb-4 border-b border-border pb-2">
				<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
					<Store className="w-5 h-5 text-primary" />
				</div>
				<span className="font-semibold text-lg">
					{ __( 'Ownership', 'wepos' ) }
				</span>
			</div>

			<RadioGroup
				value={ ownership }
				onValueChange={ handleOwnershipChange }
				className="grid grid-cols-2 gap-3"
			>
				<RadioCard
					value="admin"
					id="wepos-outlet-owner-admin"
					label={
						<span className="flex items-center gap-2">
							<ShieldCheck className="w-4 h-4 text-primary" />
							{ __( 'Admin-owned', 'wepos' ) }
						</span>
					}
					description={ __( 'Outlet is managed by site administrators.', 'wepos' ) }
				/>
				<RadioCard
					value="vendor"
					id="wepos-outlet-owner-vendor"
					label={
						<span className="flex items-center gap-2">
							<Store className="w-4 h-4 text-primary" />
							{ __( 'Assign to vendor', 'wepos' ) }
						</span>
					}
					description={ __( 'Give ownership to a Dokan vendor store.', 'wepos' ) }
				/>
			</RadioGroup>

			{ ownership === 'vendor' && (
				<div className="mt-4">
					<SmartSelect
						onSearch={ handleSearch }
						options={ options }
						value={ vendorId ? String( vendorId ) : '' }
						onValueChange={ handleValueChange }
						loading={ loading }
						placeholder={ __( 'Search vendor by name...', 'wepos' ) }
						searchPlaceholder={ __( 'Type to search vendors...', 'wepos' ) }
						emptyMessage={ __( 'No vendors found.', 'wepos' ) }
						idleMessage={ __( 'Type at least 2 characters to search.', 'wepos' ) }
						showClear
						debounceMs={ 400 }
						className="w-full"
						startIcon={ <Store className="w-4 h-4" /> }
					/>
					{ ! vendorId && (
						<p className="text-xs text-muted-foreground mt-1">
							{ __( 'Select a vendor to transfer ownership.', 'wepos' ) }
						</p>
					) }
				</div>
			) }
		</div>
	);
};

export default VendorSearch;
