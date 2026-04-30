import React, { useEffect, useRef, useState } from 'react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
	useSidebarOptional,
	useTheme,
	type ThemeMode,
} from '@wedevs/plugin-ui';
import { __ } from '@wordpress/i18n';
import { Monitor, Moon, SunMedium } from 'lucide-react';
import { setThemeModeWithTransition } from '../utils/themeModeTransition';

const HOVER_CLOSE_DELAY = 120;

export interface ThemeModeSwitcherSharedProps {
	mode: ThemeMode;
	setMode: ( mode: ThemeMode ) => void;
	isMobile?: boolean;
	isCollapsed?: boolean;
	textDomain?: string;
}

const buildThemeOptions = ( textDomain: string ): Array<{
	value: ThemeMode;
	label: string;
	icon: React.ReactNode;
} > => [
	{
		value: 'light',
		label: __( 'Light', textDomain ),
		icon: <SunMedium className="size-4" />,
	},
	{
		value: 'dark',
		label: __( 'Dark', textDomain ),
		icon: <Moon className="size-4" />,
	},
	{
		value: 'system',
		label: __( 'System', textDomain ),
		icon: <Monitor className="size-4" />,
	},
];

export const ThemeModeSwitcherShared: React.FC< ThemeModeSwitcherSharedProps > = ( {
	mode,
	setMode,
	isMobile = false,
	isCollapsed = false,
	textDomain = 'wepos',
} ) => {
	const [ open, setOpen ] = useState( false );
	const closeTimeoutRef = useRef< ReturnType< typeof setTimeout > | null >( null );
	const themeOptions = buildThemeOptions( textDomain );

	const currentOption =
		themeOptions.find( ( option ) => option.value === mode ) || themeOptions[ 2 ];

	const clearCloseTimeout = () => {
		if ( closeTimeoutRef.current ) {
			clearTimeout( closeTimeoutRef.current );
			closeTimeoutRef.current = null;
		}
	};

	const openMenu = () => {
		clearCloseTimeout();
		setOpen( true );
	};

	const scheduleClose = () => {
		clearCloseTimeout();
		closeTimeoutRef.current = setTimeout( () => {
			setOpen( false );
		}, HOVER_CLOSE_DELAY );
	};

	useEffect(
		() => () => {
			clearCloseTimeout();
		},
		[],
	);

	return (
		<div onMouseEnter={ openMenu } onMouseLeave={ scheduleClose }>
			<DropdownMenu open={ open } onOpenChange={ setOpen }>
				<DropdownMenuTrigger
					className={
						isCollapsed
							? 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex size-8 items-center justify-center rounded-md outline-none'
							: 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex min-h-8 w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none'
					}
					aria-label={ __( 'Theme mode', textDomain ) }
				>
					{ currentOption.icon }
					{ ! isCollapsed && <span>{ __( 'Theme mode', textDomain ) }</span> }
				</DropdownMenuTrigger>

				<DropdownMenuContent
					side={ isMobile ? 'top' : 'right' }
					align={ isMobile ? 'start' : 'end' }
					sideOffset={ isMobile ? 6 : 8 }
					className={ isMobile ? 'w-[var(--anchor-width)] min-w-36' : 'w-36' }
					onMouseEnter={ openMenu }
					onMouseLeave={ scheduleClose }
				>
					<DropdownMenuRadioGroup value={ mode }>
						{ themeOptions.map( ( option ) => (
							<DropdownMenuRadioItem
								key={ option.value }
								value={ option.value }
								onClick={ ( event ) => {
									setThemeModeWithTransition(
										option.value,
										mode,
										setMode,
										{ eventTarget: event.currentTarget },
									);
									setOpen( false );
								} }
							>
								{ option.icon }
								{ option.label }
							</DropdownMenuRadioItem>
						) ) }
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

const ThemeModeSwitcher: React.FC = () => {
	const { mode, setMode } = useTheme();
	const sidebar = useSidebarOptional();
	const isMobile = !! sidebar?.isMobile;
	const isCollapsed = sidebar?.state === 'collapsed' && ! isMobile;

	return (
		<ThemeModeSwitcherShared
			mode={ mode }
			setMode={ setMode }
			isMobile={ isMobile }
			isCollapsed={ isCollapsed }
			textDomain="wepos"
		/>
	);
};

export default ThemeModeSwitcher;
