import { __ } from '@wordpress/i18n';
import PrimaryLink from './PrimaryLink';
import { premiumAsset, UPGRADE_URL } from './data';

const UpgradeCta = () => (
	<section className="relative w-full max-w-[1000px] overflow-hidden rounded-[20px] bg-[#000823] px-10 py-[68px]">
		{ /* Crown art faded into the right edge, cropped the way the design
		     places it: only the lower-left of the render stays visible. */ }
		<div className="pointer-events-none absolute right-0 top-[68px] hidden h-[188px] w-[235px] overflow-hidden opacity-30 lg:block">
			<img
				src={ premiumAsset( 'cta-crown.png' ) }
				alt=""
				className="absolute left-[-40%] top-[-49.2%] h-[282.98%] w-[226.38%] max-w-none"
			/>
		</div>

		<div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
			<div className="flex max-w-[458px] flex-col gap-4 text-white">
				<h2 className="m-0 text-2xl font-bold leading-8 text-white">
					{ __(
						'Replace Two Systems With One Connected POS',
						'wepos'
					) }
				</h2>
				<p className="m-0 text-sm leading-5 text-white">
					{ __(
						'Stop juggling a separate till and a spreadsheet. Run every online and in-store sale from one dashboard with wePOS Pro.',
						'wepos'
					) }
				</p>
			</div>

			<PrimaryLink href={ UPGRADE_URL } className="shrink-0">
				{ __( 'Upgrade to Pro', 'wepos' ) }
			</PrimaryLink>
		</div>
	</section>
);

export default UpgradeCta;
