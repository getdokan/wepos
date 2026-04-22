import { useMemo, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SmartSelect, Input } from '@wedevs/plugin-ui';
import type { SettingsElement } from '@wedevs/plugin-ui';
import FieldRow from './FieldRow';

interface Props {
	element: SettingsElement;
	onChange: ( key: string, value: unknown ) => void;
}

interface CountryStateValue {
	country: string;
	state: string;
}

function parseValue( raw: unknown ): CountryStateValue {
	if ( typeof raw !== 'string' || ! raw ) {
		return { country: '', state: '' };
	}
	const [ country = '', state = '' ] = raw.split( ':' );
	return { country, state };
}

function serializeValue( country: string, state: string ): string {
	return state ? `${ country }:${ state }` : country;
}

export default function CountryStateField( { element, onChange }: Props ) {
	const key = element.dependency_key || element.id;
	const { country, state } = parseValue( element.value );

	const countries =
		( window as any ).weposAdmin?.countries ||
		( {} as Record< string, string > );
	const states =
		( window as any ).weposAdmin?.states ||
		( {} as Record< string, Record< string, string > > );

	const countryOptions = useMemo(
		() =>
			Object.entries( countries ).map( ( [ code, name ] ) => ( {
				value: code,
				label: name as string,
			} ) ),
		[ countries ]
	);

	const stateOptions = useMemo( () => {
		const bucket = states[ country ] || {};
		return Object.entries( bucket ).map( ( [ code, name ] ) => ( {
			value: code,
			label: name as string,
		} ) );
	}, [ states, country ] );

	const handleCountry = useCallback(
		( value: string ) => {
			onChange( key, serializeValue( value, '' ) );
		},
		[ key, onChange ]
	);

	const handleState = useCallback(
		( value: string ) => {
			onChange( key, serializeValue( country, value ) );
		},
		[ key, country, onChange ]
	);

	return (
		<FieldRow element={ element } layout="full-width">
			<div className="grid grid-cols-2 gap-3">
				<SmartSelect
					options={ countryOptions }
					value={ country }
					onValueChange={ handleCountry }
					placeholder={ __( 'Select country', 'wepos' ) }
					className="w-full"
				/>
				{ stateOptions.length > 0 ? (
					<SmartSelect
						options={ stateOptions }
						value={ state }
						onValueChange={ handleState }
						placeholder={ __( 'Select state', 'wepos' ) }
						className="w-full"
					/>
				) : (
					<Input
						value={ state }
						placeholder={ __( 'State (optional)', 'wepos' ) }
						onChange={ ( e ) => handleState( e.target.value ) }
					/>
				) }
			</div>
		</FieldRow>
	);
}
