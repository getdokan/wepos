import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SmartSelect } from '@wedevs/plugin-ui';
import apiFetch from '@wordpress/api-fetch';
import type { SettingsElement } from '@wedevs/plugin-ui';
import FieldRow from './FieldRow';

interface Props {
	element: SettingsElement;
	onChange: ( key: string, value: unknown ) => void;
}

interface CustomerResult {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
	username?: string;
}

function displayName( c: CustomerResult ): string {
	const full = `${ c.first_name || '' } ${ c.last_name || '' }`.trim();
	return full || c.username || c.email || '';
}

export default function CustomerSearchField( { element, onChange }: Props ) {
	const key = element.dependency_key || element.id;
	const rawValue = element.value;
	const currentId = Number( rawValue ) > 0 ? String( rawValue ) : '';

	const [ options, setOptions ] = useState<
		{ value: string; label: string }[]
	>( [] );
	const [ loading, setLoading ] = useState( false );

	useEffect( () => {
		if ( ! currentId ) return;
		apiFetch< CustomerResult >( {
			path: `wc/v3/customers/${ currentId }`,
		} )
			.then( ( c ) => {
				setOptions( ( prev ) => {
					if ( prev.some( ( o ) => o.value === String( c.id ) ) ) {
						return prev;
					}
					return [
						{ value: String( c.id ), label: displayName( c ) },
						...prev,
					];
				} );
			} )
			.catch( () => {} );
	}, [ currentId ] );

	const handleSearch = useCallback( async ( query: string ) => {
		if ( ! query.trim() ) {
			setOptions( [] );
			return;
		}
		setLoading( true );
		try {
			const results = await apiFetch< CustomerResult[] >( {
				path: `wc/v3/customers?search=${ encodeURIComponent( query ) }&role=all`,
			} );
			setOptions(
				results.map( ( c ) => ( {
					value: String( c.id ),
					label: `${ displayName( c ) } (${ c.email })`,
				} ) )
			);
		} catch {
			setOptions( [] );
		} finally {
			setLoading( false );
		}
	}, [] );

	const handleChange = ( val: string ) => {
		onChange( key, val ? Number( val ) : 0 );
	};

	return (
		<FieldRow element={ element }>
			<div className="max-w-56 md:max-w-full w-full">
				<SmartSelect
					options={ options }
					value={ currentId }
					onValueChange={ handleChange }
					onSearch={ handleSearch }
					loading={ loading }
					placeholder={ __( 'Guest Customer', 'wepos' ) }
					searchPlaceholder={ __( 'Search customer…', 'wepos' ) }
					emptyMessage={ __( 'No customer found', 'wepos' ) }
					idleMessage={ __( 'Type to search…', 'wepos' ) }
					showClear
					debounceMs={ 300 }
					className="w-full"
				/>
			</div>
		</FieldRow>
	);
}
