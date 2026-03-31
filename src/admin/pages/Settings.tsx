import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Settings as SettingsUI,
	Button,
	toast,
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
	rest: {
		root: string;
		nonce: string;
	};
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
	access_data: Record<
		string,
		{
			name: string;
			capabilities: {
				wepos: Record< string, boolean >;
				wc: Record< string, boolean >;
				wp: Record< string, boolean >;
			};
		}
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

/* ─── Access schema constants ─────────────────────────────────────────── */

/**
 * Default roles to display in the Access tab.
 * Pro can add 'cashier' via the `wepos_access_display_roles` filter.
 */
const DEFAULT_DISPLAY_ROLES = [
	'administrator',
	'editor',
	'author',
	'contributor',
	'subscriber',
	'customer',
	'shop_manager',
];

/**
 * Capability group labels and ordering.
 */
const CAP_GROUPS: Array< { key: string; label: string } > = [
	{ key: 'wepos', label: __( 'WePOS', 'wepos' ) },
	{ key: 'wc', label: __( 'WooCommerce', 'wepos' ) },
	{ key: 'wp', label: __( 'WordPress', 'wepos' ) },
];

/* ─── Schema builders ─────────────────────────────────────────────────── */

/**
 * Build schema elements for standard settings sections (General, Receipts, etc.).
 * Returns a flat array for the plugin-ui formatter.
 */
function buildStandardSchema(
	sections: WeposAdminData[ 'settings_sections' ],
	fields: WeposAdminData[ 'settings_fields' ]
): SettingsElement[] {
	const elements: SettingsElement[] = [];

	sections.forEach( ( section, i ) => {
		// Skip access — it has its own builder
		if ( section.id === 'wepos_access' ) {
			return;
		}

		elements.push( {
			id: section.id,
			type: 'subpage',
			label: section.title,
			icon: ICON_MAP[ section.icon ] || 'Settings',
			page_id: 'wepos_settings',
			priority: ( i + 1 ) * 10,
		} as SettingsElement );

		const sectionId = `${ section.id }_section`;
		elements.push( {
			id: sectionId,
			type: 'section',
			label: '',
			page_id: section.id,
			priority: 10,
		} as SettingsElement );

		const sectionFields = fields[ section.id ] || {};
		Object.values( sectionFields ).forEach( ( field, j ) => {
			elements.push( {
				id: field.name,
				type: 'field',
				label: field.label,
				description: field.desc ? stripHtml( field.desc ) : '',
				dependency_key: field.name,
				variant: VARIANT_MAP[ field.type ] || 'text',
				value: field.default ?? '',
				default: field.default ?? '',
				placeholder: field.placeholder ?? '',
				section_id: sectionId,
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
			} as SettingsElement );
		} );
	} );

	return elements;
}

/**
 * Build flat schema elements for the Access subpage.
 *
 * Structure:
 *   subpage (Access)
 *     → tab (Administrator) → tab (Editor) → ...
 *       → section (WePOS) → section (WooCommerce) → section (WordPress)
 *         → field (switch for each capability)
 */
function buildAccessSchema(
	accessData: WeposAdminData[ 'access_data' ],
	sectionPriority: number
): SettingsElement[] {
	if ( ! accessData || typeof accessData !== 'object' ) {
		return [];
	}

	const elements: SettingsElement[] = [];

	// Subpage
	elements.push( {
		id: 'wepos_access',
		type: 'subpage',
		label: __( 'Access', 'wepos' ),
		description: __(
			'By default, access to the POS is limited to Administrator, Shop Manager and Cashier roles. It is recommended that you do not change the default settings unless you are fully aware of the consequences.',
			'wepos'
		),
		icon: 'ShieldCheck',
		page_id: 'wepos_settings',
		priority: sectionPriority,
	} as SettingsElement );

	// Allow pro to add roles (e.g. 'cashier') via filter.
	const displayRoles = applyFilters< string[] >(
		'wepos_access_display_roles',
		DEFAULT_DISPLAY_ROLES
	);

	// Filter to only display roles that exist in the system
	const roles = displayRoles.filter( ( slug: string ) => accessData[ slug ] );

	roles.forEach( ( roleSlug, roleIdx ) => {
		const role = accessData[ roleSlug ];
		const tabId = `access_tab_${ roleSlug }`;

		// Tab per role
		elements.push( {
			id: tabId,
			type: 'tab',
			label: role.name,
			page_id: 'wepos_access',
			priority: ( roleIdx + 1 ) * 10,
		} as SettingsElement );

		// Sections per capability group
		CAP_GROUPS.forEach( ( group, groupIdx ) => {
			const caps =
				role.capabilities[
					group.key as keyof typeof role.capabilities
				];
			if ( ! caps || Object.keys( caps ).length === 0 ) {
				return;
			}

			const sectionId = `access_${ roleSlug }_${ group.key }`;

			elements.push( {
				id: sectionId,
				type: 'section',
				label: group.label,
				section_id: tabId,
				priority: ( groupIdx + 1 ) * 10,
			} as SettingsElement );

			// Switch field per capability
			Object.entries( caps ).forEach(
				( [ cap, enabled ], capIdx ) => {
					const fieldKey = `access__${ roleSlug }__${ cap }`;

					elements.push( {
						id: fieldKey,
						type: 'field',
						variant: 'switch',
						label: cap,
						dependency_key: fieldKey,
						value: enabled ? 'yes' : 'no',
						default: enabled ? 'yes' : 'no',
						enable_state: {
							value: 'yes',
							title: __( 'Enabled', 'wepos' ),
						},
						disable_state: {
							value: 'no',
							title: __( 'Disabled', 'wepos' ),
						},
						section_id: sectionId,
						priority: ( capIdx + 1 ) * 10,
					} as SettingsElement );
				}
			);
		} );
	} );

	return elements;
}

/**
 * Build the full flat schema from PHP data + access data.
 */
function buildSchema(
	sections: WeposAdminData[ 'settings_sections' ],
	fields: WeposAdminData[ 'settings_fields' ],
	accessData: WeposAdminData[ 'access_data' ]
): SettingsElement[] {
	const elements: SettingsElement[] = [];

	// Root page
	elements.push( {
		id: 'wepos_settings',
		type: 'page',
		label: __( 'Settings', 'wepos' ),
		icon: 'Settings',
		priority: 10,
	} as SettingsElement );

	// Standard settings subpages (General, Receipts, etc.)
	elements.push( ...buildStandardSchema( sections, fields ) );

	// Access subpage with role tabs
	const accessPriority =
		( sections.findIndex( ( s ) => s.id === 'wepos_access' ) + 1 ) * 10 ||
		( sections.length + 1 ) * 10;
	elements.push( ...buildAccessSchema( accessData, accessPriority ) );

	return elements;
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

/**
 * Parse an access dependency_key into role slug, group, and capability.
 * Key format: access__{role}__{cap}
 */
function parseAccessKey(
	key: string
): { role: string; cap: string } | null {
	const match = key.match( /^access__([^_]+(?:_[^_]+)*)__(.+)$/ );
	if ( ! match ) return null;
	return { role: match[ 1 ], cap: match[ 2 ] };
}

/* ─── Component ────────────────────────────────────────────────────────── */

const Settings = () => {
	const [ values, setValues ] = useState< Record< string, unknown > >( {} );
	const [ loading, setLoading ] = useState( true );
	const [ saving, setSaving ] = useState( false );

	const {
		settings_sections: rawSections,
		settings_fields,
		access_data: accessData,
		ajaxurl,
		nonce,
		rest,
	} = window.weposAdmin;

	// wp_localize_script can serialize PHP arrays as JS objects.
	const settings_sections: WeposAdminData[ 'settings_sections' ] =
		Array.isArray( rawSections )
			? rawSections
			: Object.values( rawSections || {} );

	// Build the flat schema from PHP-provided data.
	const schema = useMemo( () => {
		const base = buildSchema(
			settings_sections,
			settings_fields,
			accessData
		);

		return applyFilters< SettingsElement[] >(
			'wepos_react_settings_schema',
			base
		);
	}, [ settings_sections, settings_fields, accessData ] );

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

					// Merge access values from the pre-loaded access_data
					const accessValues: Record< string, unknown > = {};
					if ( accessData ) {
						for ( const [ roleSlug, role ] of Object.entries(
							accessData
						) ) {
							for ( const [ , caps ] of Object.entries(
								role.capabilities
							) ) {
								for ( const [ cap, enabled ] of Object.entries(
									caps
								) ) {
									accessValues[
										`access__${ roleSlug }__${ cap }`
									] = enabled ? 'yes' : 'no';
								}
							}
						}
					}

					setValues( {
						...defaults,
						...saved,
						...accessValues,
					} );
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
	 * Save handler — routes to AJAX for standard settings,
	 * or to REST API for access settings.
	 */
	const handleSave = useCallback(
		async (
			scopeId: string,
			scopeValues: Record< string, unknown >
		) => {
			if ( scopeId === 'wepos_access' ) {
				// Access save: group changes by role and send to REST API
				await saveAccessSettings( scopeValues, rest );
				return;
			}

			// Standard settings save via AJAX
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

				if ( result.success ) {
					toast.success(
						__( 'Settings saved successfully.', 'wepos' )
					);
				} else {
					toast.error(
						__( 'Failed to save settings.', 'wepos' )
					);
				}
			} catch {
				toast.error( __( 'Failed to save settings.', 'wepos' ) );
			} finally {
				setSaving( false );
			}
		},
		[ ajaxurl, nonce, rest ]
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
					<Button
						onClick={ save }
						disabled={ ! dirty || saving }
					>
						{ saving ? (
							<LoaderCircle className="size-4 mr-2 animate-spin" />
						) : (
							<Save className="size-4 mr-2" />
						) }
						{ __( 'Save Changes', 'wepos' ) }
					</Button>
				) }
			/>
		</div>
	);
};

/* ─── Access save helper ──────────────────────────────────────────────── */

/**
 * Save access capability changes via REST API.
 * Groups flat values by role and sends one request per changed role.
 */
async function saveAccessSettings(
	scopeValues: Record< string, unknown >,
	restConfig: { root: string; nonce: string }
) {
	// Group values by role
	const roleUpdates: Record<
		string,
		Record< string, Record< string, boolean > >
	> = {};

	for ( const [ key, value ] of Object.entries( scopeValues ) ) {
		const parsed = parseAccessKey( key );
		if ( ! parsed ) continue;

		const { role, cap } = parsed;
		const enabled = value === 'yes' || value === true;

		// Determine which group this cap belongs to
		let group = 'wp';
		if ( cap === 'access_wepos' || cap === 'manage_wepos' ) {
			group = 'wepos';
		} else if ( cap !== 'read' ) {
			group = 'wc';
		}

		if ( ! roleUpdates[ role ] ) {
			roleUpdates[ role ] = {};
		}
		if ( ! roleUpdates[ role ][ group ] ) {
			roleUpdates[ role ][ group ] = {};
		}
		roleUpdates[ role ][ group ][ cap ] = enabled;
	}

	try {
		// Send one request per role (REST API expects one role per request)
		for ( const [ roleSlug, capsData ] of Object.entries( roleUpdates ) ) {
			const response = await fetch(
				`${ restConfig.root }wepos/v1/settings/access`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-WP-Nonce': restConfig.nonce,
					},
					body: JSON.stringify( { [ roleSlug ]: capsData } ),
				}
			);

			if ( ! response.ok ) {
				throw new Error( 'Failed to update' );
			}
		}

		toast.success( __( 'Access settings saved successfully.', 'wepos' ) );
	} catch {
		toast.error( __( 'Failed to save access settings.', 'wepos' ) );
	}
}

export default Settings;
