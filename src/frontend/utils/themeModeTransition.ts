import { flushSync } from 'react-dom';
import type { ThemeMode } from '@wedevs/plugin-ui';

type SetThemeMode = ( mode: ThemeMode ) => void;

interface ThemeTransitionOptions {
	eventTarget?: EventTarget | null;
	x?: number;
	y?: number;
}

interface StartViewTransitionDocument extends Document {
	startViewTransition?: ( callback: () => void ) => {
		ready: Promise< void >;
	};
}

const getTransitionOrigin = (
	options: ThemeTransitionOptions = {},
): { x: number; y: number } => {
	if (
		options.eventTarget instanceof Element &&
		typeof options.eventTarget.getBoundingClientRect === 'function'
	) {
		const rect = options.eventTarget.getBoundingClientRect();

		return {
			x: rect.left + rect.width / 2,
			y: rect.top + rect.height / 2,
		};
	}

	return {
		x: options.x ?? window.innerWidth / 2,
		y: options.y ?? window.innerHeight / 2,
	};
};

export const setThemeModeWithTransition = (
	newMode: ThemeMode,
	currentMode: ThemeMode,
	setMode: SetThemeMode,
	options: ThemeTransitionOptions = {},
) => {
	if ( newMode === currentMode ) {
		return;
	}

	const transitionDocument = document as StartViewTransitionDocument;

	if ( ! transitionDocument.startViewTransition ) {
		setMode( newMode );
		return;
	}

	const { x, y } = getTransitionOrigin( options );
	const maxRadius = Math.hypot(
		Math.max( x, window.innerWidth - x ),
		Math.max( y, window.innerHeight - y ),
	);

	const transition = transitionDocument.startViewTransition( () => {
		flushSync( () => {
			setMode( newMode );
		} );
	} );

	transition.ready.then( () => {
		document.documentElement.animate(
			{
				clipPath: [
					`circle(0px at ${ x }px ${ y }px)`,
					`circle(${ maxRadius }px at ${ x }px ${ y }px)`,
				],
			},
			{
				duration: 500,
				easing: 'ease-in-out',
				pseudoElement: '::view-transition-new(root)',
			},
		);
	} );
};

export default setThemeModeWithTransition;
