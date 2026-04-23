import { useMemo, useState, useEffect, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addFilter, applyFilters } from '@wordpress/hooks';
import {
	Settings,
	Button,
	ButtonToggleGroup,
	toast,
	type SettingsElement,
} from '@wedevs/plugin-ui';
import { LoaderCircle, Save } from 'lucide-react';

interface AppearanceData {
	settings: {
		pos_layout_style: 'latest' | 'legacy';
		admin_ui_style: 'new' | 'legacy';
	};
	rest: {
		root: string;
		nonce: string;
	};
}

declare global {
	interface Window {
		weposAppearance?: AppearanceData;
	}
}

const defaults = {
	pos_layout_style: 'latest' as const,
	admin_ui_style: 'new' as const,
};

const HOOK_PREFIX = 'wepos_appearance';

interface UiToggleOption {
	value: string;
	label: string;
}

type MergedElement = SettingsElement & {
	options?: UiToggleOption[];
};

const UiToggleField = ( {
	element,
	onChange,
}: {
	element: MergedElement;
	onChange: ( key: string, value: unknown ) => void;
} ) => {
	const options = ( element.options as UiToggleOption[] | undefined ) || [];
	const value = ( element.value as string | undefined ) || '';
	const label = element.label || element.title || '';
	const description = element.description || '';

	return (
		<div className="grid grid-cols-12 gap-4 items-center w-full p-4">
			<div className="sm:col-span-8 col-span-12">
				{ label && (
					<div className="text-sm font-medium text-foreground">
						{ label }
					</div>
				) }
				{ description && (
					<p className="mt-1 text-sm text-muted-foreground">
						{ description }
					</p>
				) }
			</div>
			<div className="sm:col-span-4 col-span-12 flex sm:justify-end">
				<ButtonToggleGroup
					items={ options.map( ( opt ) => ( {
						value: String( opt.value ),
						label: opt.label,
					} ) ) }
					value={ value }
					onChange={ ( next ) => {
						if ( element.dependency_key ) {
							onChange( element.dependency_key, next );
						}
					} }
				/>
			</div>
		</div>
	);
};

let variantRegistered = false;
function registerUiToggleVariant() {
	if ( variantRegistered ) {
		return;
	}
	variantRegistered = true;

	addFilter(
		`${ HOOK_PREFIX }_settings_ui_toggle_field`,
		'wepos/appearance/ui_toggle',
		( defaultElement: React.ReactElement, mergedElement: MergedElement ) => {
			// plugin-ui passes the merged element (value included) but the
			// bound onChange lives on the fallback element — reuse it so
			// the custom variant writes back to the Settings context.
			const defaultProps =
				( defaultElement as { props?: { onChange?: ( k: string, v: unknown ) => void } } )
					?.props || {};
			const onChange =
				defaultProps.onChange || ( () => undefined );

			return createElement( UiToggleField, {
				element: mergedElement,
				onChange,
			} );
		}
	);
}

function buildSchema(): SettingsElement[] {
	const posOptions: UiToggleOption[] = [
		{ value: 'latest', label: __( 'New UI (React)', 'wepos' ) },
		{ value: 'legacy', label: __( 'Legacy UI (Vue)', 'wepos' ) },
	];

	const adminOptions: UiToggleOption[] = [
		{ value: 'new', label: __( 'New UI (React)', 'wepos' ) },
		{ value: 'legacy', label: __( 'Legacy UI (Vue)', 'wepos' ) },
	];

	return [
		{
			id: 'appearance',
			type: 'page',
			is_danger: false,
			label: __( 'Appearance', 'wepos' ),
			priority: 10,
			children: [
				{
					id: 'appearance_general',
					type: 'section',
					is_danger: false,
					label: __( 'General', 'wepos' ),
					description: __(
						'Choose which user interface wePOS uses on the POS frontend and inside the WordPress admin.',
						'wepos'
					),
					page_id: 'appearance',
					priority: 10,
					children: [
						{
							id: 'pos_layout_style',
							type: 'field',
							is_danger: false,
							variant: 'ui_toggle',
							label: __( 'POS Layout Style', 'wepos' ),
							description: __(
								'Controls the interface customers and cashiers see on the frontend POS.',
								'wepos'
							),
							layout: 'horizontal',
							dependency_key: 'wepos_appearance.pos_layout_style',
							default: defaults.pos_layout_style,
							options: posOptions,
							section_id: 'appearance_general',
							priority: 10,
						} as SettingsElement,
						{
							id: 'admin_ui_style',
							type: 'field',
							is_danger: false,
							variant: 'ui_toggle',
							label: __( 'Admin Dashboard UI', 'wepos' ),
							description: __(
								'Controls the interface of every wePOS page inside the WordPress admin.',
								'wepos'
							),
							layout: 'horizontal',
							dependency_key: 'wepos_appearance.admin_ui_style',
							default: defaults.admin_ui_style,
							options: adminOptions,
							section_id: 'appearance_general',
							priority: 20,
						} as SettingsElement,
					],
				},
			],
		},
	];
}

const App = () => {
	const bootstrap = window.weposAppearance?.settings || defaults;
	const rest = window.weposAppearance?.rest;

	const [ values, setValues ] = useState< Record< string, unknown > >( {
		'wepos_appearance.pos_layout_style': bootstrap.pos_layout_style,
		'wepos_appearance.admin_ui_style': bootstrap.admin_ui_style,
	} );
	const [ saving, setSaving ] = useState( false );

	useEffect( () => {
		registerUiToggleVariant();
	}, [] );

	const schema = useMemo( () => buildSchema(), [] );

	const handleChange = ( _scopeId: string, key: string, next: unknown ) => {
		setValues( ( prev ) => ( { ...prev, [ key ]: next } ) );
	};

	const handleSave = async (
		_scopeId: string,
		_tree: Record< string, unknown >,
		flat: Record< string, unknown >
	) => {
		if ( ! rest ) {
			toast.error( __( 'REST configuration missing.', 'wepos' ) );
			return;
		}

		setSaving( true );

		try {
			const res = await fetch( `${ rest.root }wepos/v1/settings`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': rest.nonce,
				},
				body: JSON.stringify( {
					wepos_appearance: {
						pos_layout_style:
							flat[ 'wepos_appearance.pos_layout_style' ] ??
							values[ 'wepos_appearance.pos_layout_style' ],
						admin_ui_style:
							flat[ 'wepos_appearance.admin_ui_style' ] ??
							values[ 'wepos_appearance.admin_ui_style' ],
					},
				} ),
			} );

			if ( ! res.ok ) {
				throw new Error( 'save_failed' );
			}

			toast.success( __( 'Appearance saved. Reloading…', 'wepos' ) );

			setTimeout( () => {
				window.location.reload();
			}, 400 );
		} catch ( err ) {
			setSaving( false );
			toast.error( __( 'Could not save appearance settings.', 'wepos' ) );
		}
	};

	return (
		<div className="pui-root" style={ { padding: '16px' } }>
			<Settings
				title={ __( 'Appearance', 'wepos' ) }
				schema={ schema }
				values={ values }
				hookPrefix={ HOOK_PREFIX }
				applyFilters={ applyFilters }
				onChange={ handleChange }
				onSave={ handleSave }
				renderSaveButton={ ( { onSave } ) => (
					<Button onClick={ onSave } disabled={ saving }>
						{ saving ? (
							<LoaderCircle className="animate-spin" />
						) : (
							<Save />
						) }
						{ saving
							? __( 'Saving…', 'wepos' )
							: __( 'Save Changes', 'wepos' ) }
					</Button>
				) }
			/>
		</div>
	);
};

export default App;
