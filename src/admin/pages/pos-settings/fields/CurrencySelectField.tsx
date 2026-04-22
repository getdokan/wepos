import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SmartSelect } from '@wedevs/plugin-ui';
import type { SettingsElement } from '@wedevs/plugin-ui';
import { useCurrenciesRef } from '../reference-data';
import FieldRow from './FieldRow';

interface Props {
	element: SettingsElement;
	onChange: ( key: string, value: unknown ) => void;
}

type CurrencyData = { name: string; symbol: string };

export default function CurrencySelectField( { element, onChange }: Props ) {
	const key = element.dependency_key || element.id;
	const currencies = useCurrenciesRef();

	const options = useMemo(
		() =>
			Object.entries( currencies ).map(
				( [ code, data ]: [ string, CurrencyData ] ) => ( {
					value: code,
					label: `${ data.name } (${ data.symbol || code })`,
				} )
			),
		[ currencies ]
	);

	return (
		<FieldRow element={ element }>
			<div className="max-w-56 md:max-w-full w-full">
				<SmartSelect
					options={ options }
					value={ String( element.value || '' ) }
					onValueChange={ ( v ) => onChange( key, v ) }
					placeholder={ __( 'Select currency', 'wepos' ) }
					className="w-full"
				/>
			</div>
		</FieldRow>
	);
}
