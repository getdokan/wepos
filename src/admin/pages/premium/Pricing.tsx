import { __, sprintf } from '@wordpress/i18n';
import { ArrowRight, CircleCheck } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { COUPON_CODE, PRICING_PLANS, UPGRADE_URL } from './data';

/**
 * Billing switch.
 *
 * The Figma design shows Annual and Lifetime pills, but only annual prices
 * exist in it — so Lifetime sends the visitor to the pricing page instead of
 * rendering invented numbers. Swap it for a stateful toggle once lifetime
 * pricing is available here.
 */
const BillingToggle = () => (
	<div className="flex items-center rounded-[58px] bg-white p-2 shadow-sm">
		<span className="flex items-center justify-center rounded-[58px] bg-[#4f46e5] px-[30px] py-[10px] text-base leading-7 text-white">
			{ __( 'Annual', 'wepos' ) }
		</span>
		<a
			href={ UPGRADE_URL }
			target="_blank"
			rel="noopener noreferrer"
			className="flex items-center justify-center rounded-[58px] px-[30px] py-[10px] text-base leading-7 text-[#5e6479] no-underline hover:text-[#4f46e5]"
		>
			{ __( 'Lifetime', 'wepos' ) }
		</a>
	</div>
);

const Pricing = () => (
	<section className="flex w-full max-w-[1000px] flex-col items-center gap-8">
		<SectionHeading
			title={ __( 'Simple Pricing That Grows With You', 'wepos' ) }
			description={ sprintf(
				/* translators: %s: coupon code. */
				__(
					'Get up to 25%% off on the Starter and Business plans. Coupon: %s',
					'wepos'
				),
				COUPON_CODE
			) }
			className="max-w-[633px]"
		/>

		<BillingToggle />

		<div className="grid w-full grid-cols-1 overflow-hidden rounded-2xl border border-[#e4e4e4] lg:grid-cols-3">
			{ PRICING_PLANS.map( ( plan, index ) => (
				<div
					key={ plan.name }
					className={ `flex flex-col gap-6 bg-white px-[21px] py-[25px] ${
						index > 0
							? 'border-t border-[#e4e4e4] lg:border-l lg:border-t-0'
							: ''
					}` }
				>
					<div className="flex flex-col gap-6">
						<div className="flex flex-col gap-3">
							<div className="flex items-center gap-3">
								<h3 className="m-0 text-base font-semibold leading-[1.2] text-[#101828]">
									{ plan.name }
								</h3>
								{ plan.badge && (
									<span className="rounded-[20px] bg-[#88ffb3] px-2 py-1.5 text-xs leading-none text-[#0e0e0f]">
										{ plan.badge }
									</span>
								) }
							</div>
							<p className="m-0 text-sm leading-[1.3] text-[#4a5565]">
								{ plan.description }
							</p>
						</div>

						<div className="flex items-end gap-2">
							<span className="text-4xl font-bold leading-[1.2] text-[#101828]">
								{ plan.price }
							</span>
							<span className="text-base leading-[2] text-[#6a7282]">
								{ plan.period }
							</span>
						</div>
					</div>

					<a
						href={ UPGRADE_URL }
						target="_blank"
						rel="noopener noreferrer"
						className={ `flex h-[45px] items-center justify-center gap-1.5 rounded-[5px] px-5 text-sm font-bold no-underline transition-colors ${
							plan.highlighted
								? 'bg-[#4f39f6] text-white hover:bg-[#4331d4] hover:text-white'
								: 'border border-[#d3d3d3] bg-white text-[#0e0e0f] hover:border-[#4f39f6] hover:text-[#4f39f6]'
						}` }
					>
						{ __( 'Get Started', 'wepos' ) }
						<ArrowRight className="size-4 shrink-0" />
					</a>

					<ul className="m-0 flex list-none flex-col gap-2.5 p-0">
						{ plan.features.map( ( feature, featureIndex ) => (
							<li
								key={ feature }
								className="flex items-center gap-2"
							>
								<CircleCheck className="size-5 shrink-0 text-[#4f39f6]" />
								<span
									className={ `text-sm leading-[1.3] ${
										featureIndex === 0
											? 'font-bold text-black'
											: 'text-[#4a5565]'
									}` }
								>
									{ feature }
								</span>
							</li>
						) ) }
					</ul>
				</div>
			) ) }
		</div>
	</section>
);

export default Pricing;
