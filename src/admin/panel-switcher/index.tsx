import { createRoot } from '@wordpress/element';
import domReady from '@wordpress/dom-ready';
import PanelSwitch from './PanelSwitch';

domReady( function () {
	const container = document.getElementById( 'wepos-panel-switch' );

	if ( container ) {
		const root = createRoot( container );
		root.render( <PanelSwitch /> );
	}
} );
