import AdvancedTools from './premium/AdvancedTools';
import DokanPos from './premium/DokanPos';
import FeatureComparison from './premium/FeatureComparison';
import HeroBanner from './premium/HeroBanner';
import Pricing from './premium/Pricing';
import RefundPolicy from './premium/RefundPolicy';
import TrustedBy from './premium/TrustedBy';
import UpgradeCta from './premium/UpgradeCta';

/**
 * wePOS Pro upgrade page.
 *
 * Implements the "wePOS Upgarde to Pro" Figma frame (3710:3440). The banded
 * layout mirrors the design: white sections at page width, with the tools
 * grid on its own full-bleed grey band.
 */
const Premium = () => (
	<div className="wepos-admin-premium -mx-5 -mt-2.5">
		<div className="flex w-full flex-col items-center gap-18 px-6 py-18 sm:px-8">
			<HeroBanner />
			<FeatureComparison />
		</div>

		<AdvancedTools />

		<div className="flex w-full flex-col items-center gap-18 px-6 py-18 bg-white">
			<DokanPos />
			<TrustedBy />
		</div>

		<div className="flex w-full flex-col items-center gap-10 bg-[#f5f5f5] px-6 py-18">
			<Pricing />
			<RefundPolicy />
			<UpgradeCta />
		</div>
	</div>
);

export default Premium;
