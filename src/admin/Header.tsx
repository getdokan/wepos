import React from 'react';
import { createRoot } from 'react-dom/client';
import { __, sprintf } from '@wordpress/i18n';
import { Slot, SlotFillProvider } from '@wordpress/components';
import { PluginArea } from '@wordpress/plugins';
import { ThemeProvider, TopBar, type ThemeTokens } from '@wedevs/plugin-ui';
import { Headset, Lightbulb } from 'lucide-react';

export const HEADER_SLOT_NAME = 'wepos-admin-header-before-info-section';
const HEADER_PLUGIN_SCOPE = 'wepos-admin-header';

/** Version pill: `#FFF4F2` fill, 20% `#F0644B` hairline, fully rounded. */
const BRAND_ACCENT = '#F0644B';
const VERSION_BADGE_CLASS =
	'rounded-full border-[#F0644B]/20 bg-[#FFF4F2] text-[#F0644B] md:px-3 md:py-1';

const ACTION_BASE_CLASS =
	'inline-flex items-center justify-center gap-2 rounded-md py-[9px] pl-[15px] pr-[17px] text-sm font-medium leading-5 no-underline transition-colors';

interface HeaderInfo {
	logo_url?: string;
	version?: string;
	is_pro_active?: boolean;
	pro_version?: string;
	feedback_url?: string;
	support_url?: string;
}

const Header = () => {
	const {
		logo_url: logoUrl = '',
		version = '',
		is_pro_active: isProActive = false,
		pro_version: proVersion = '',
		feedback_url: feedbackUrl = '',
		support_url: supportUrl = '',
	}: HeaderInfo =
		( window as any ).weposAdminPanelHeaderSettings?.header_info || {};

	const versions = [
		{
			/* translators: %s: wePOS version number */
			version: sprintf( __( 'Free: %s', 'wepos' ), version ),
			isPro: false,
			className: VERSION_BADGE_CLASS,
		},
	];

	if ( isProActive ) {
		versions.push( {
			/* translators: %s: wePOS Pro version number */
			version: sprintf( __( 'Pro: %s', 'wepos' ), proVersion ),
			isPro: true,
			className: VERSION_BADGE_CLASS,
			proBadgeBg: BRAND_ACCENT,
			proBadgeColor: '#ffffff',
			proBadgeBorderColor: BRAND_ACCENT,
		} as ( typeof versions )[ number ] );
	}

	return (
		<TopBar
			className="sticky top-8 z-10 items-center border-0 border-b border-solid border-border shadow-sm"
			logo={
				logoUrl ? (
					<img
						src={ logoUrl }
						alt={ __( 'wePOS', 'wepos' ) }
						className="h-full w-auto"
					/>
				) : null
			}
			versions={ versions }
			rightSideComponents={
				<>
					{ /* Extension seam — pro fills this through registerPlugin. */ }
					<Slot
						name={ HEADER_SLOT_NAME }
						fillProps={ { header_info: { version, proVersion } } }
					/>

					{ !! feedbackUrl && (
						<a
							href={ feedbackUrl }
							target="_blank"
							rel="noopener noreferrer"
							className={ `${ ACTION_BASE_CLASS } text-[#374151]! hover:text-[#111827]!` }
						>
							<Lightbulb className="size-5 shrink-0 text-[#ffa600]!" />
							{ __( 'Feedback', 'wepos' ) }
						</a>
					) }

					{ !! supportUrl && (
						<a
							href={ supportUrl }
							target="_blank"
							rel="noopener noreferrer"
							className={ `${ ACTION_BASE_CLASS } bg-[#4f39f6] text-white! hover:bg-[#4331d4] hover:text-white!` }
						>
							<Headset className="size-5 shrink-0 text-white!" />
							{ __( 'Support', 'wepos' ) }
						</a>
					) }
				</>
			}
		/>
	);
};

/**
 * Mount the header in its own root, above the page app.
 *
 * Also moves the admin notices `Admin\Header` captured into a hidden
 * wrapper down below the header. Runs at footer script-eval time — before
 * core's `DOMContentLoaded` pass appends stray notices after the
 * `.wp-header-end` catcher inside that wrapper.
 *
 * @param tokens Theme tokens of the calling admin root.
 */
export const mountHeader = ( tokens: ThemeTokens ) => {
	const noticeList = document.getElementById( 'wepos__notice-list' );
	const noticeSlot = document.getElementById( 'wepos-admin-notices' );

	if ( noticeList && noticeSlot ) {
		noticeSlot.appendChild( noticeList );
		noticeList.classList.remove( 'wepos-notice-list-hide' );
	}

	const container = document.getElementById( 'wepos-admin-panel-header' );

	if ( ! container ) {
		return;
	}

	createRoot( container ).render(
		<React.StrictMode>
			<ThemeProvider pluginId="wepos-admin" tokens={ tokens }>
				<SlotFillProvider>
					<Header />
					<PluginArea scope={ HEADER_PLUGIN_SCOPE } />
				</SlotFillProvider>
			</ThemeProvider>
		</React.StrictMode>
	);
};

export default Header;
