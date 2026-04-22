import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SmartSelect } from '@wedevs/plugin-ui';
import type { SettingsElement } from '@wedevs/plugin-ui';
import { useTaxClassesRef } from '../reference-data';
import FieldRow from './FieldRow';

interface Props {
	element: SettingsElement;
	onChange: ( key: string, value: unknown ) => void;
}

export default function TaxClassSelectField( { element, onChange }: Props ) {
	const key = element.dependency_key || element.id;
	const taxClasses = useTaxClassesRef();

	const options = useMemo( () => {
		const entries = Object.entries( taxClasses );
		if ( entries.length === 0 ) {
			return [
				{
					value: 'inherit',
					label: __( 'Inherit shipping class', 'wepos' ),
				},
				{ value: '', label: __( 'Standard', 'wepos' ) },
			];
		}
		return [
			{
				value: 'inherit',
				label: __( 'Inherit shipping class', 'wepos' ),
			},
			...entries.map( ( [ slug, label ] ) => ( {
				value: slug,
				label: String( label ),
			} ) ),
		];
	}, [ taxClasses ] );

	return (
		<FieldRow element={ element }>
			<div className="max-w-56 md:max-w-full w-full">
				<SmartSelect
					options={ options }
					value={ String( element.value || '' ) }
					onValueChange={ ( v ) => onChange( key, v ) }
					placeholder={ __( 'Select tax class', 'wepos' ) }
					disableSearch
					className="w-full"
				/>
			</div>
		</FieldRow>
	);
}
