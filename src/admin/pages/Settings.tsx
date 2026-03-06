import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Settings as SettingsUI,
	Button,
	type SettingsElement,
} from '@wedevs/plugin-ui';
import { LoaderCircle, Save } from 'lucide-react';
import { applyFilters } from '@react/hooks/useExtensions';

/**
 * Shape of the `weposAdmin` global set by Dashboard.php via wp_localize_script.
 */
interface WeposAdminData {
	ajaxurl: string;
	nonce: string;
	settings_sections: Array< {
		id: string;
		title: string;
		icon: string;
	} >;
	settings_fields: Record<
		string,
		Record<
			string,
			{
				name: string;
				label: string;
				desc?: string;
				type: string;
				default?: string;
				options?: Record< string, string >;
				placeholder?: string;
				min?: number;
				max?: number;
				step?: number;
			}
		>
	>;
}

declare global {
	interface Window {
		weposAdmin: WeposAdminData;
	}
}

/* ─── Mappers ──────────────────────────────────────────────────────────── */

const VARIANT_MAP: Record< string, string > = {
	text: 'text',
	email: 'text',
	url: 'text',
	number: 'number',
	textarea: 'textarea',
	select: 'select',
	radio: 'radio_capsule',
	checkbox: 'switch',
	multicheck: 'multicheck',
	wpeditor: 'textarea',
	color: 'color_picker',
	html: 'html',
};

const ICON_MAP: Record< string, string > = {
	'dashicons-admin-generic': 'Settings',
	'dashicons-media-text': 'FileText',
	'dashicons-cart': 'ShoppingCart',
	'dashicons-admin-users': 'Users',
	'dashicons-money-alt': 'DollarSign',
	'dashicons-store': 'Store',
};

function stripHtml( html: string ): string {
	const tmp = document.createElement( 'div' );
	tmp.innerHTML = html;
	return tmp.textContent || tmp.innerText || '';
}

/* ─── Schema builder ───────────────────────────────────────────────────── */

/**
 * Build a fully-enriched hierarchical schema (like Dokan) from the PHP data.
 *
 * The plugin-ui formatter sees `children` on the root page and treats the
 * data as already hierarchical, returning it as-is.  This lets us keep
 * `dependency_key` as the bare PHP field name (e.g. "enable_fee_tax")
 * so values load/save are 1-to-1 with the old Vue page.
 */
function buildSchema(
	sections: WeposAdminData[ 'settings_sections' ],
	fields: WeposAdminData[ 'settings_fields' ]
): SettingsElement[] {
	const pageId = 'wepos_settings';
	const hookBase = 'wepos_settings';

	const subpages: SettingsElement[] = sections.map( ( section, i ) => {
		const subpageHook = `${ hookBase }_${ section.id }`;
		const sectionId = `${ section.id }_section`;
		const sectionHook = `${ subpageHook }_${ sectionId }`;
		const sectionFields = fields[ section.id ] || {};

		const fieldElements: SettingsElement[] = Object.values(
			sectionFields
		).map( ( field, j ) => {
			const fieldHook = `${ sectionHook }_${ field.name }`;

			return {
				id: field.name,
				type: 'field',
				title: field.label,
				label: field.label,
				icon: '',
				tooltip: '',
				display: true,
				hook_key: fieldHook,
				children: [],
				description: field.desc ? stripHtml( field.desc ) : '',
				dependency_key: field.name,
				dependencies: [],
				validations: [],
				variant: VARIANT_MAP[ field.type ] || 'text',
				value: field.default ?? '',
				default: field.default ?? '',
				placeholder: field.placeholder ?? '',
				readonly: false,
				disabled: false,
				size: 20,
				helper_text: '',
				postfix: '',
				prefix: '',
				image_url: '',
				is_danger: false,
				priority: ( j + 1 ) * 10,
				options: field.options
					? Object.entries( field.options ).map(
							( [ val, lbl ] ) => ( {
								value: val,
								label: lbl,
							} )
						)
					: [],
				...( field.min !== undefined ? { min: field.min } : {} ),
				...( field.max !== undefined ? { max: field.max } : {} ),
			} as SettingsElement;
		} );

		return {
			id: section.id,
			type: 'subpage',
			title: section.title,
			label: section.title,
			icon: ICON_MAP[ section.icon ] || 'Settings',
			tooltip: '',
			display: true,
			hook_key: subpageHook,
			is_danger: false,
			priority: ( i + 1 ) * 10,
			children: [
				{
					id: sectionId,
					type: 'section',
					title: '',
					label: '',
					icon: '',
					tooltip: '',
					display: true,
					hook_key: sectionHook,
					is_danger: false,
					children: fieldElements,
					dependencies: [],
					validations: [],
					dependency_key: '',
				} as SettingsElement,
			],
			dependencies: [],
			validations: [],
			dependency_key: '',
		} as SettingsElement;
	} );

	return [
		{
			id: pageId,
			type: 'page',
			title: __( 'Settings', 'wepos' ),
			label: __( 'Settings', 'wepos' ),
			icon: 'Settings',
			tooltip: '',
			display: true,
			hook_key: hookBase,
			is_danger: false,
			children: subpages,
			dependencies: [],
			validations: [],
			dependency_key: '',
		} as SettingsElement,
	];
}

/* ─── Value helpers ────────────────────────────────────────────────────── */

/**
 * Flatten `{ section: { field: value } }` → `{ field: value }`.
 */
function flattenValues(
	nested: Record< string, Record< string, unknown > >
): Record< string, unknown > {
	const flat: Record< string, unknown > = {};

	for ( const sectionValues of Object.values( nested ) ) {
		if ( sectionValues && typeof sectionValues === 'object' ) {
			for ( const [ key, value ] of Object.entries( sectionValues ) ) {
				flat[ key ] = value;
			}
		}
	}

	return flat;
}

/* ─── Component ────────────────────────────────────────────────────────── */

const Settings = () => {
	const [ values, setValues ] = useState< Record< string, unknown > >( {} );
	const [ loading, setLoading ] = useState( true );
	const [ saving, setSaving ] = useState( false );

	const { settings_sections, settings_fields, ajaxurl, nonce } =
		window.weposAdmin;

	// Build the hierarchical schema from the PHP-provided data.
	const schema = useMemo( () => {
		const base = buildSchema( settings_sections, settings_fields );

		return applyFilters< SettingsElement[] >(
			'wepos_react_settings_schema',
			base
		);
	}, [ settings_sections, settings_fields ] );

	// Load current settings values on mount.
	useEffect( () => {
		const formData = new FormData();
		formData.append( 'action', 'wepos_get_setting_values' );
		formData.append( 'nonce', nonce );

		fetch( ajaxurl, { method: 'POST', body: formData } )
			.then( ( res ) => res.json() )
			.then( ( response ) => {
				if ( response.success && response.data ) {
					const defaults: Record< string, unknown > = {};

					for ( const sectionFields of Object.values(
						settings_fields
					) ) {
						for ( const field of Object.values( sectionFields ) ) {
							if ( field.default !== undefined ) {
								defaults[ field.name ] = field.default;
							}
						}
					}

					const saved = flattenValues( response.data );
					setValues( { ...defaults, ...saved } );
				}
			} )
			.catch( ( err ) => {
				console.error( 'wePos: failed to load settings', err );
			} )
			.finally( () => setLoading( false ) );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	const handleChange = useCallback(
		( _scopeId: string, key: string, value: unknown ) => {
			setValues( ( prev ) => ( { ...prev, [ key ]: value } ) );
		},
		[]
	);

	/**
	 * Save — identical payload to the old Vue page:
	 *   action           = wepos_save_settings
	 *   nonce            = <wepos_nonce>
	 *   section          = wepos_general | wepos_receipts | …
	 *   settingsData[k]  = v
	 */
	const handleSave = useCallback(
		async (
			scopeId: string,
			scopeValues: Record< string, unknown >
		) => {
			setSaving( true );

			try {
				const formData = new FormData();
				formData.append( 'action', 'wepos_save_settings' );
				formData.append( 'nonce', nonce );
				formData.append( 'section', scopeId );

				for ( const [ key, value ] of Object.entries( scopeValues ) ) {
					formData.append(
						`settingsData[${ key }]`,
						String( value ?? '' )
					);
				}

				const res = await fetch( ajaxurl, {
					method: 'POST',
					body: formData,
				} );

				const result = await res.json();

				if ( ! result.success ) {
					console.error( 'wePos: save failed', result );
				}
			} catch ( err ) {
				console.error( 'wePos: save error', err );
			} finally {
				setSaving( false );
			}
		},
		[ ajaxurl, nonce ]
	);

	return (
		<div className="wepos-admin-settings -mx-[20px] -mt-[10px]">
			<SettingsUI
				schema={ schema }
				values={ values }
				onChange={ handleChange }
				onSave={ handleSave }
				loading={ loading }
				title={ __( 'Settings', 'wepos' ) }
				hookPrefix="wepos"
				renderSaveButton={ ( { dirty, onSave: save } ) => (
					<Button onClick={ save } disabled={ ! dirty || saving }>
						{
							saving ? (
								<LoaderCircle className="size-4 mr-2 animate-spin" />
							) : (
								<Save className="size-4 mr-2" />
							)
						}
						{ __( 'Save Changes', 'wepos' ) }
					</Button>
				) }
			/>
		</div>
	);
};

export default Settings;
