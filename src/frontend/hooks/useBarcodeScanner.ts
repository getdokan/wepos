import { useEffect, useRef, useCallback } from 'react';
import type { BarcodeSettings } from './useBarcodeSettings';

interface UseBarcodeReaderOptions {
	settings: BarcodeSettings;
	enabled?: boolean;
	onBarcode: ( barcode: string ) => void;
	onKeyEvent?: ( key: string ) => void;
}

/**
 * Hook that detects barcode scanner input by measuring keypress timing.
 *
 * Barcode scanners send characters much faster than human typing.
 * When the average time between keypresses is below the threshold,
 * and the result meets the minimum length, the accumulated string
 * is treated as a barcode.
 */
export function useBarcodeScanner( {
	settings,
	enabled = true,
	onBarcode,
	onKeyEvent,
}: UseBarcodeReaderOptions ) {
	const bufferRef = useRef< string >( '' );
	const timestampsRef = useRef< number[] >( [] );
	const timerRef = useRef< ReturnType< typeof setTimeout > | null >( null );

	// Use refs so the keydown handler always sees the latest values
	const settingsRef = useRef( settings );
	settingsRef.current = settings;

	const onBarcodeRef = useRef( onBarcode );
	onBarcodeRef.current = onBarcode;

	const onKeyEventRef = useRef( onKeyEvent );
	onKeyEventRef.current = onKeyEvent;

	const enabledRef = useRef( enabled );
	enabledRef.current = enabled;

	const processBuffer = useCallback( () => {
		const { averageTimeThreshold, minimumLength, prefix, suffix } = settingsRef.current;
		let value = bufferRef.current;
		const times = timestampsRef.current;

		// Reset buffer
		bufferRef.current = '';
		timestampsRef.current = [];

		if ( ! value ) return;

		// Calculate average time between keypresses
		if ( times.length > 1 ) {
			let totalDelta = 0;
			for ( let i = 1; i < times.length; i++ ) {
				totalDelta += times[ i ] - times[ i - 1 ];
			}
			const avgTime = totalDelta / ( times.length - 1 );

			// If average time exceeds threshold, this is likely human typing
			if ( avgTime > averageTimeThreshold ) return;
		}

		// Strip prefix
		if ( prefix && value.startsWith( prefix ) ) {
			value = value.slice( prefix.length );
		}

		// Strip suffix
		if ( suffix && value.endsWith( suffix ) ) {
			value = value.slice( 0, -suffix.length );
		}

		// Check minimum length
		if ( value.length < minimumLength ) return;

		onBarcodeRef.current( value );
	}, [] );

	useEffect( () => {
		const handleKeyDown = ( e: KeyboardEvent ) => {
			if ( ! enabledRef.current ) return;

			// Report ALL keypress events for the test area (including modifiers)
			if ( onKeyEventRef.current ) {
				onKeyEventRef.current( e.key );
			}

			// Only accumulate printable characters into the buffer
			if ( e.key.length !== 1 ) return;

			// Skip buffer accumulation if user is typing in an input/textarea
			const target = e.target as HTMLElement;
			if (
				target.tagName === 'INPUT' ||
				target.tagName === 'TEXTAREA' ||
				target.isContentEditable
			) {
				return;
			}

			const now = performance.now();
			bufferRef.current += e.key;
			timestampsRef.current.push( now );

			// Reset the flush timer
			if ( timerRef.current ) {
				clearTimeout( timerRef.current );
			}

			// Wait a bit longer than threshold to allow full scan to complete
			timerRef.current = setTimeout( processBuffer, settingsRef.current.averageTimeThreshold * 3 );
		};

		document.addEventListener( 'keydown', handleKeyDown, true );

		return () => {
			document.removeEventListener( 'keydown', handleKeyDown, true );
			if ( timerRef.current ) {
				clearTimeout( timerRef.current );
			}
		};
	}, [ processBuffer ] );

	const resetBuffer = useCallback( () => {
		bufferRef.current = '';
		timestampsRef.current = [];
		if ( timerRef.current ) {
			clearTimeout( timerRef.current );
			timerRef.current = null;
		}
	}, [] );

	return { resetBuffer };
}
