import { useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { applyFilters } from '@wordpress/hooks';

declare global {
	interface Window {
		weposPanelSwitch?: {
			current_panel: 'vue' | 'react';
			supported_keys: string[];
			pages: Record<
				string,
				{
					active: string;
					switch_url: string;
				}
			>;
			nonce: string;
			admin_url: string;
		};
	}
}

/**
 * Panel Switch Component
 *
 * Handles switching between legacy Vue and new React admin panel interfaces.
 * Renders a banner with a link to switch to the other panel.
 */
const PanelSwitch = () => {
	const [ currentHash, setCurrentHash ] = useState(
		window.location.hash
	);

	const supportedKeys = applyFilters(
		'wepos_admin_panel_switch_supported_keys',
		window.weposPanelSwitch?.supported_keys || [ 'settings' ]
	) as string[];

	const getHashPathSegments = () => {
		const hashPath = currentHash.replace( '#/', '' );
		const pathWithoutQuery = hashPath.split( '?' )[ 0 ];

		return pathWithoutQuery.split( '/' ).filter( Boolean );
	};

	useEffect( () => {
		const checkAndUpdate = () => {
			setCurrentHash( window.location.hash );
		};

		checkAndUpdate();

		window.addEventListener( 'hashchange', checkAndUpdate );
		return () =>
			window.removeEventListener( 'hashchange', checkAndUpdate );
	}, [] );

	const data = window.weposPanelSwitch;

	if ( ! data ) {
		return null;
	}

	const { nonce, admin_url: adminUrl } = data;
	const baseUrl = getHashPathSegments()[ 0 ] ?? 'settings';
	const isSupported = supportedKeys.includes( baseUrl );

	if ( ! isSupported || ! nonce || ! adminUrl ) {
		return null;
	}

	const switchingUrl = addQueryArgs( adminUrl, {
		_wpnonce: nonce,
		wepos_action: 'switch_panel',
		page_key: baseUrl,
	} );

	const page = new URLSearchParams( window.location.search ).get(
		'page'
	);

	return (
		<span className="wepos-panel-switch-banner" style={ { fontSize: '13px' } }>
			{ page !== 'wepos-dashboard'
				? sprintf(
						/* translators: %s: The page name, e.g. "settings" */
						__(
							'To try wePos new %s,',
							'wepos'
						),
						baseUrl
				  )
				: sprintf(
						/* translators: %s: The page name, e.g. "settings" */
						__(
							'If you want to go back to old %s,',
							'wepos'
						),
						baseUrl
				  ) }{ ' ' }
			<a
				href={ switchingUrl || '#' }
				style={ {
					color: '#7047EB',
					fontWeight: 'bold',
					textDecoration: 'underline',
				} }
			>
				{ __( 'Click Here', 'wepos' ) }
			</a>
		</span>
	);
};

export default PanelSwitch;
