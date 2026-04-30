import { useEffect, useRef } from 'react';
import { useTheme, type ThemeMode } from '@wedevs/plugin-ui';
import { posAPI } from '../api';

const LEGACY_STORAGE_KEYS = [ 'wepos_theme', 'wepos_theme_mode' ];

type ThemePayload = { mode?: ThemeMode };

function coerceMode( value: unknown ): ThemeMode | null {
	if ( value === 'light' || value === 'dark' || value === 'system' ) {
		return value;
	}
	return null;
}

function clearLegacyKeys() {
	for ( const key of LEGACY_STORAGE_KEYS ) {
		try {
			localStorage.removeItem( key );
		} catch {
			// ignore
		}
	}
}

/**
 * Sync plugin-ui ThemeProvider mode with the user's `wepos_theme` meta.
 *
 * On mount: pulls the stored mode from the server and applies it.
 * On change: pushes the new mode to the server so it follows the user
 * across devices, replacing the prior localStorage-only persistence.
 */
export function useThemeSettings() {
	const { mode, setMode } = useTheme();
	const hydratedRef = useRef( false );
	const lastSyncedRef = useRef< ThemeMode | null >( null );

	useEffect( () => {
		let cancelled = false;

		( async () => {
			try {
				const response = await posAPI.settings.getSettings();
				const payload = ( response as unknown as { wepos_theme?: ThemePayload } )
					.wepos_theme;
				const remoteMode = coerceMode( payload?.mode );

				if ( cancelled ) return;

				if ( remoteMode && remoteMode !== mode ) {
					setMode( remoteMode );
					lastSyncedRef.current = remoteMode;
				} else if ( remoteMode ) {
					lastSyncedRef.current = remoteMode;
				}

				clearLegacyKeys();
			} catch {
				// ignore — keep current mode
			} finally {
				if ( ! cancelled ) {
					hydratedRef.current = true;
				}
			}
		} )();

		return () => {
			cancelled = true;
		};
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect( () => {
		if ( ! hydratedRef.current ) return;
		if ( lastSyncedRef.current === mode ) return;

		lastSyncedRef.current = mode;

		void posAPI.settings
			.updateSettings( { wepos_theme: { mode } } )
			.catch( () => {
				// swallow — next change retries.
			} );
	}, [ mode ] );

	return { mode, setMode };
}
