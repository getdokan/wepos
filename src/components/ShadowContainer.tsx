/**
 * ShadowContainer — Renders children inside a Shadow DOM for CSS isolation.
 *
 * Adapted from wepos-pro/src/dokan/ShadowContainer.tsx (proven working).
 *
 * - Creates a shadow root on a host element
 * - Injects CSS into the shadow root via <link> tags
 * - Monkey-patches document.body.appendChild/insertBefore/removeChild to
 *   intercept plugin-ui portal containers (.pui-root) and redirect them
 *   into the shadow root.
 *
 * NOTE: The shadow root is created once and reused across React.StrictMode
 * double-mount cycles. The DOM patches are re-installed on every mount so
 * they survive the cleanup → re-mount cycle.
 *
 * @since 1.4.0
 */
import { useRef, useEffect, useState, type ReactNode } from '@wordpress/element';
import { createPortal } from 'react-dom';

interface ShadowContainerProps {
	cssUrls: string[];
	children: ReactNode;
}

/**
 * Check if a node is a plugin-ui portal container.
 * Modal creates: <div data-pui-modal-root class="pui-root">
 * Dialog/AlertDialog/DropdownMenu creates: <div class="pui-root"> via @base-ui Portal
 */
function isPuiPortal( node: Node ): boolean {
	if ( ! ( node instanceof HTMLElement ) ) {
		return false;
	}
	return (
		node.hasAttribute( 'data-pui-modal-root' ) ||
		node.hasAttribute( 'data-sonner-toaster' ) ||
		node.classList.contains( 'pui-root' )
	);
}

const ShadowContainer = ( { cssUrls, children }: ShadowContainerProps ) => {
	const hostRef = useRef< HTMLDivElement >( null );
	const [ mountTarget, setMountTarget ] = useState< HTMLElement | null >( null );
	const shadowRef = useRef< ShadowRoot | null >( null );
	const portalHostRef = useRef< HTMLElement | null >( null );

	// --- Effect 1: Create the shadow root (once) ---
	useEffect( () => {
		const host = hostRef.current;
		if ( ! host || shadowRef.current ) {
			return;
		}

		const shadow = host.attachShadow( { mode: 'open' } );
		shadowRef.current = shadow;

		// Inject CSS via <link> tags
		for ( const url of cssUrls ) {
			const link = document.createElement( 'link' );
			link.rel = 'stylesheet';
			link.href = url;
			shadow.appendChild( link );
		}

		// Create mount point for React content
		const mount = document.createElement( 'div' );
		mount.id = 'wepos-shadow-mount';
		mount.className = 'pui-root';
		shadow.appendChild( mount );

		// Create a container for intercepted portals inside shadow root
		const portalHost = document.createElement( 'div' );
		portalHost.id = 'wepos-shadow-portals';
		shadow.appendChild( portalHost );
		portalHostRef.current = portalHost;

		setMountTarget( mount );
	}, [] );

	// --- Effect 2: Install DOM patches (re-runs after StrictMode cleanup) ---
	useEffect( () => {
		const portalHost = portalHostRef.current;
		if ( ! portalHost ) {
			return;
		}

		// Track which nodes we've intercepted so removeChild works
		const interceptedNodes = new WeakSet< Node >();

		// Monkey-patch document.body to intercept portal containers
		const originalAppendChild = document.body.appendChild.bind( document.body );
		const originalInsertBefore = document.body.insertBefore.bind( document.body );
		const originalRemoveChild = document.body.removeChild.bind( document.body );

		document.body.appendChild = function < T extends Node >( node: T ): T {
			if ( isPuiPortal( node ) ) {
				interceptedNodes.add( node );
				portalHost.appendChild( node );
				return node;
			}
			return originalAppendChild( node );
		};

		document.body.insertBefore = function < T extends Node >(
			node: T,
			ref: Node | null
		): T {
			if ( isPuiPortal( node ) ) {
				interceptedNodes.add( node );
				portalHost.appendChild( node );
				return node;
			}
			return originalInsertBefore( node, ref );
		};

		document.body.removeChild = function < T extends Node >( node: T ): T {
			if ( interceptedNodes.has( node ) ) {
				interceptedNodes.delete( node );
				if ( node.parentNode === portalHost ) {
					portalHost.removeChild( node );
				}
				return node;
			}
			return originalRemoveChild( node );
		};

		return () => {
			// Restore original methods
			document.body.appendChild = originalAppendChild;
			document.body.insertBefore = originalInsertBefore;
			document.body.removeChild = originalRemoveChild;
		};
	}, [ mountTarget ] );

	return (
		<>
			<div ref={ hostRef } style={ { display: 'contents' } } />
			{ mountTarget && createPortal( children, mountTarget ) }
		</>
	);
};

export default ShadowContainer;
