import { createHooks } from '@wordpress/hooks';

// Use the global hooks instance created by PHP inline script (before any bundles load).
// This allows pro/extension scripts that load before wepos-react to register hooks
// that will be applied when the base app renders.
// Falls back to creating a new instance if the global doesn't exist (e.g., standalone dev).
export const weposHooks = ( window as any ).__weposReactHooks || createHooks();

// Ensure the global reference is set (for extensions that load after base)
( window as any ).__weposReactHooks = weposHooks;

// Typed helper functions
export function applyFilters<T>( hookName: string, value: T, ...args: any[] ): T {
	return weposHooks.applyFilters( hookName, value, ...args ) as T;
}

export function addFilter(
	hookName: string,
	namespace: string,
	callback: Function,
	priority?: number,
) {
	weposHooks.addFilter( hookName, namespace, callback, priority );
}

export function doAction( hookName: string, ...args: any[] ) {
	weposHooks.doAction( hookName, ...args );
}

export function addAction(
	hookName: string,
	namespace: string,
	callback: Function,
	priority?: number,
) {
	weposHooks.addAction( hookName, namespace, callback, priority );
}

// Convenience helper matching the Vue pattern: push a component into an array filter
export function addComponentFilter(
	hookName: string,
	namespace: string,
	component: React.ComponentType<any>,
	priority = 10,
) {
	weposHooks.addFilter(
		hookName,
		namespace,
		( components: React.ComponentType<any>[] ) => {
			return [ ...components, component ];
		},
		priority,
	);
}
