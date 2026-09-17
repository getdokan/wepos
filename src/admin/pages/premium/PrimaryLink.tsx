import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface PrimaryLinkProps {
	href: string;
	children: ReactNode;
	/** Hide the trailing arrow (used by the coupon-style buttons). */
	icon?: ReactNode;
	variant?: 'solid' | 'outline';
	className?: string;
}

/**
 * The marketing CTA used across the Premium page.
 *
 * Deliberately not the plugin-ui `Button`: this page follows the Figma
 * upgrade design (fixed indigo, 6px radius) rather than the admin theme
 * tokens, and every instance is an external link.
 */
const PrimaryLink = ( {
	href,
	children,
	icon,
	variant = 'solid',
	className = '',
}: PrimaryLinkProps ) => {
	const base =
		'inline-flex items-center justify-center gap-3 rounded-md py-[9px] pl-[17px] pr-[15px] text-base font-medium no-underline transition-colors';
	const styles =
		variant === 'solid'
			? 'bg-[#4f39f6] text-white shadow-sm hover:bg-[#4331d4] hover:text-white'
			: 'border border-[#3c434a] text-[#a7aaad] hover:text-white';

	return (
		<a
			href={ href }
			target="_blank"
			rel="noopener noreferrer"
			className={ `${ base } ${ styles } ${ className }` }
		>
			{ children }
			{ icon ?? <ArrowRight className="size-5 shrink-0" /> }
		</a>
	);
};

export default PrimaryLink;
