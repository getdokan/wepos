import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SmartSelect, type SmartSelectOption } from '@wedevs/plugin-ui';
import { Store } from 'lucide-react';
import apiFetch from '@wordpress/api-fetch';

interface VendorSearchProps {
	vendorId?: number;
	onVendorChange: ( vendorId?: number ) => void;
}

const VendorSearch = ( { vendorId, onVendorChange }: VendorSearchProps ) => {
	const [ searchResults, setSearchResults ] = useState< SmartSelectOption[] >( [] );
	const [ selectedVendor, setSelectedVendor ] = useState< SmartSelectOption | null >( null );
	const [ loading, setLoading ] = useState( false );

	// Always include selected vendor in options so the trigger label stays visible
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
				onVendorChange( undefined );
			}
		},
		[ options, onVendorChange ],
	);

	// Load vendor details when editing an existing outlet
	useEffect( () => {
		if ( ! vendorId || vendorId === 0 ) {
			setSelectedVendor( null );
			return;
		}

		// Skip fetch if we already have this vendor loaded
		if ( selectedVendor?.value === String( vendorId ) ) return;

		apiFetch< any >( { path: `dokan/v1/stores/${ vendorId }` } )
			.then( ( v ) => {
				setSelectedVendor( {
					value: String( v.id ),
					label: v.store_name || v.name || `Vendor #${ v.id }`,
					description: v.email || undefined,
				} );
			} )
			.catch( () => {} );
	}, [ vendorId ] );

	return (
		<div className="py-4">
			<div className="flex items-center gap-3 mb-4 border-b border-border pb-2">
				<div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
					<Store className="w-5 h-5 text-primary" />
				</div>
				<span className="font-semibold text-lg">
					{ __( 'Vendor Assignment', 'wepos' ) }
				</span>
			</div>

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
			<p className="text-xs text-muted-foreground mt-1">
				{ __( 'Leave empty for admin-owned outlet.', 'wepos' ) }
			</p>
		</div>
	);
};

export default VendorSearch;
