import { __ } from '@wordpress/i18n';
import {
	ChartNoAxesColumn,
	FileSpreadsheet,
	FileText,
	Pencil,
	ShieldCheck,
	ShoppingCart,
	Store,
	TriangleAlert,
	type LucideIcon,
} from 'lucide-react';

/** Where every upgrade CTA on this page points. */
export const UPGRADE_URL =
	'https://dokan.co/wordpress/wepos/pricing/?utm_source=free-pro-dashboard&utm_medium=wordpress-menu&utm_campaign=free-to-pro-upgrade';

/** Docs page for the Dokan multivendor POS section. */
export const DOKAN_POS_DOC_URL =
	'https://dokan.co/docs/wepos/tutorials/how-to-use-wepos-with-dokan/';

/**
 * YouTube id played in the Dokan section's video frame. The Figma frame is a
 * video placeholder with no source attached — this is the wePOS overview video
 * from readme.txt; swap the id when the Dokan POS walkthrough is published.
 */
export const DOKAN_POS_VIDEO_ID = '9zURW3eo5y4';

/** Coupon advertised in the hero banner. */
export const COUPON_CODE = 'Upgrade2Pro';

/**
 * Root of the plugin's assets directory, set by Dashboard.php via
 * wp_localize_script. Falls back to an empty string so the page still
 * renders (without art) if the global is missing.
 */
export const assetsUrl = (): string =>
	( window as any ).weposAdmin?.assets_url?.replace( /\/$/, '' ) || '';

export const premiumAsset = ( file: string ): string =>
	`${ assetsUrl() }/images/premium/${ file }`;

/* ─── Lite vs Pro comparison ──────────────────────────────────────────── */

export interface ComparisonRow {
	feature: string;
	lite: boolean;
}

export const COMPARISON_ROWS: ComparisonRow[] = [
	{ feature: __( 'Sell online and in person', 'wepos' ), lite: true },
	{ feature: __( 'Barcode scanning', 'wepos' ), lite: true },
	{ feature: __( 'Real-time inventory sync', 'wepos' ), lite: true },
	{ feature: __( 'Light, Dark, and System modes', 'wepos' ), lite: false },
	{ feature: __( 'Dokan multivendor POS', 'wepos' ), lite: false },
	{ feature: __( 'Reports dashboard', 'wepos' ), lite: false },
	{ feature: __( 'CSV order export', 'wepos' ), lite: false },
	{ feature: __( 'Save Carts across devices', 'wepos' ), lite: false },
	{ feature: __( 'Access control and Cashier roles', 'wepos' ), lite: false },
	{ feature: __( 'Rich-text receipt builder', 'wepos' ), lite: false },
];

/* ─── Pro feature cards ───────────────────────────────────────────────── */

export interface ProTool {
	icon: LucideIcon;
	title: string;
	description: string;
}

export const PRO_TOOLS: ProTool[] = [
	{
		icon: ChartNoAxesColumn,
		title: __( 'Reports Dashboard', 'wepos' ),
		description: __(
			'See sales summaries, charts, top sellers, and payment reports on one screen, so you always know how the store is doing.',
			'wepos'
		),
	},
	{
		icon: FileSpreadsheet,
		title: __( 'CSV Order Export', 'wepos' ),
		description: __(
			'Export your orders straight from the dashboard for accounting, reconciliation, or your own analysis.',
			'wepos'
		),
	},
	{
		icon: ShoppingCart,
		title: __( 'Save Carts', 'wepos' ),
		description: __(
			'Hold an in-progress cart and pick it up later, even on a different device. Nothing gets lost mid-sale.',
			'wepos'
		),
	},
	{
		icon: ShieldCheck,
		title: __( 'Access Control and Cashier Roles', 'wepos' ),
		description: __(
			'Decide exactly which pages and actions each cashier can reach. A built-in Cashier role gets new staff working safely in minutes.',
			'wepos'
		),
	},
	{
		icon: FileText,
		title: __( 'Rich-Text Receipt Builder', 'wepos' ),
		description: __(
			'Customize your receipt header and footer with bold text, links, and lists, and show shipping and tax as their own lines.',
			'wepos'
		),
	},
	{
		icon: Store,
		title: __( 'Per-Vendor Dokan POS', 'wepos' ),
		description: __(
			'Every Dokan vendor gets their own dashboard, reports, receipts, and settings, seeing only their own store data.',
			'wepos'
		),
	},
	{
		icon: Pencil,
		title: __( 'Quick Edit', 'wepos' ),
		description: __(
			'Update stock, price, categories, and tags right from the product list, without opening each product.',
			'wepos'
		),
	},
	{
		icon: TriangleAlert,
		title: __( 'Low-Stock Alerts', 'wepos' ),
		description: __(
			'An inventory panel flags low and out-of-stock products at a glance, so you never run out unexpectedly.',
			'wepos'
		),
	},
];

/* ─── Pricing plans ───────────────────────────────────────────────────── */

export interface PricingPlan {
	name: string;
	description: string;
	price: string;
	period: string;
	badge?: string;
	highlighted?: boolean;
	features: string[];
}

export const PRICING_PLANS: PricingPlan[] = [
	{
		name: __( 'Starter', 'wepos' ),
		description: __( 'For a single store running one POS counter.', 'wepos' ),
		price: '$99',
		period: __( '/y', 'wepos' ),
		features: [
			__( '1 Site', 'wepos' ),
			__( 'Reports dashboard', 'wepos' ),
			__( 'Barcode scanner support', 'wepos' ),
			__( 'CSV export', 'wepos' ),
			__( 'Save Carts across devices', 'wepos' ),
			__( 'Rich-text receipts', 'wepos' ),
		],
	},
	{
		name: __( 'Professional', 'wepos' ),
		description: __( 'For growing businesses with a few locations.', 'wepos' ),
		price: '$124',
		period: __( '/y', 'wepos' ),
		features: [
			__( '3 Sites', 'wepos' ),
			__( 'Everything in Starter', 'wepos' ),
			__( 'Access control and Cashier roles', 'wepos' ),
			__( 'Quick Edit for products', 'wepos' ),
			__( 'Low-stock alerts', 'wepos' ),
			__( 'Priority support', 'wepos' ),
		],
	},
	{
		name: __( 'Business', 'wepos' ),
		description: __( 'For agencies and multi-location retail.', 'wepos' ),
		price: '$199',
		period: __( '/y', 'wepos' ),
		badge: __( 'Best Valued', 'wepos' ),
		highlighted: true,
		features: [
			__( '10 Sites', 'wepos' ),
			__( 'Everything in Professional', 'wepos' ),
			__( 'Full Dokan vendor POS', 'wepos' ),
			__( 'Per-vendor dashboards and reports', 'wepos' ),
			__( 'Priority support', 'wepos' ),
		],
	},
];
