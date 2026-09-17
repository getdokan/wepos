import { __ } from '@wordpress/i18n';
import { premiumAsset } from './data';

const RefundPolicy = () => (
	<section className="flex w-full max-w-[1000px] flex-col items-center justify-between gap-8 rounded-[20px] border border-[#e4e4e4] bg-white p-10 lg:flex-row">
		<div className="flex max-w-[751px] flex-col gap-8">
			<div className="flex flex-col gap-5">
				<h2 className="m-0 text-[30px] font-extrabold leading-9 text-[#111827]">
					{ __( 'Our Fair Refund Policy', 'wepos' ) }
				</h2>
				<p className="m-0 text-sm leading-[1.4] text-[#1f2937]">
					{ __(
						'We stand behind wePOS Pro with a 14-day money-back guarantee. However, if our plugin does not meet your needs, we will happily provide a full refund within 14 days of your purchase.',
						'wepos'
					) }
				</p>
			</div>

			<div className="flex flex-wrap items-center gap-5">
				<span className="text-xs font-semibold leading-4 text-[#1f2937]">
					{ __( 'Payment Options:', 'wepos' ) }
				</span>
				<img
					src={ premiumAsset( 'payment-methods.png' ) }
					alt={ __(
						'PayPal, Visa, Mastercard, JCB, Discover and American Express',
						'wepos'
					) }
					className="h-[39px] w-auto max-w-full"
				/>
			</div>
		</div>

		<img
			src={ premiumAsset( 'refund-badge.svg' ) }
			alt={ __( '14 day money back guarantee', 'wepos' ) }
			className="size-[158px] shrink-0"
		/>
	</section>
);

export default RefundPolicy;
