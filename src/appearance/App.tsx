import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
	Button,
	RadioGroup,
	LabeledRadio,
	Separator,
	toast,
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

const App = () => {
	const bootstrap = window.weposAppearance?.settings || defaults;
	const rest = window.weposAppearance?.rest;

	const [ posLayout, setPosLayout ] = useState< 'latest' | 'legacy' >(
		( bootstrap.pos_layout_style as 'latest' | 'legacy' ) || 'latest'
	);
	const [ adminUi, setAdminUi ] = useState< 'new' | 'legacy' >(
		( bootstrap.admin_ui_style as 'new' | 'legacy' ) || 'new'
	);
	const [ saving, setSaving ] = useState( false );

	const handleSave = async () => {
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
						pos_layout_style: posLayout,
						admin_ui_style: adminUi,
					},
				} ),
			} );

			if ( ! res.ok ) {
				throw new Error( 'save_failed' );
			}

			toast.success( __( 'Appearance saved. Reloading…', 'wepos' ) );

			// Full reload so the correct Vue/React bundle loads on the next
			// paint — the selected style governs what the admin/frontend mounts.
			setTimeout( () => {
				window.location.reload();
			}, 400 );
		} catch ( err ) {
			setSaving( false );
			toast.error( __( 'Could not save appearance settings.', 'wepos' ) );
		}
	};

	return (
		<div className="pui-root" style={ { padding: '24px 16px', maxWidth: 820 } }>
			<div style={ { marginBottom: 20 } }>
				<h1 style={ { fontSize: 22, fontWeight: 600, margin: 0 } }>
					{ __( 'Appearance', 'wepos' ) }
				</h1>
				<p
					style={ {
						margin: '6px 0 0',
						color: 'var(--color-muted-foreground)',
					} }
				>
					{ __(
						'Choose which user interface wePOS uses on the POS frontend and inside the WordPress admin.',
						'wepos'
					) }
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{ __( 'POS Layout Style', 'wepos' ) }</CardTitle>
					<CardDescription>
						{ __(
							'Controls the interface customers and cashiers see on the frontend POS.',
							'wepos'
						) }
					</CardDescription>
				</CardHeader>
				<CardContent>
					<RadioGroup
						value={ posLayout }
						onValueChange={ ( v ) =>
							setPosLayout( v as 'latest' | 'legacy' )
						}
					>
						<LabeledRadio
							id="pos-layout-latest"
							value="latest"
							label={ __( 'New UI (React)', 'wepos' ) }
							description={ __(
								'Modern React interface with the latest POS features.',
								'wepos'
							) }
						/>
						<LabeledRadio
							id="pos-layout-legacy"
							value="legacy"
							label={ __( 'Legacy UI (Vue)', 'wepos' ) }
							description={ __(
								'Classic Vue interface retained for backwards compatibility.',
								'wepos'
							) }
						/>
					</RadioGroup>
				</CardContent>
			</Card>

			<Separator style={ { margin: '20px 0' } } />

			<Card>
				<CardHeader>
					<CardTitle>
						{ __( 'Admin Dashboard UI', 'wepos' ) }
					</CardTitle>
					<CardDescription>
						{ __(
							'Controls the interface of every wePOS page inside the WordPress admin.',
							'wepos'
						) }
					</CardDescription>
				</CardHeader>
				<CardContent>
					<RadioGroup
						value={ adminUi }
						onValueChange={ ( v ) =>
							setAdminUi( v as 'new' | 'legacy' )
						}
					>
						<LabeledRadio
							id="admin-ui-new"
							value="new"
							label={ __( 'New UI (React)', 'wepos' ) }
							description={ __(
								'Renders all wePOS admin pages with the React dashboard.',
								'wepos'
							) }
						/>
						<LabeledRadio
							id="admin-ui-legacy"
							value="legacy"
							label={ __( 'Legacy UI (Vue)', 'wepos' ) }
							description={ __(
								'Falls back to the original Vue admin pages.',
								'wepos'
							) }
						/>
					</RadioGroup>
				</CardContent>
				<CardFooter style={ { justifyContent: 'flex-end' } }>
					<Button onClick={ handleSave } disabled={ saving }>
						{ saving ? (
							<LoaderCircle className="animate-spin" />
						) : (
							<Save />
						) }
						{ saving
							? __( 'Saving…', 'wepos' )
							: __( 'Save Changes', 'wepos' ) }
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
};

export default App;
