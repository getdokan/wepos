import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { toast } from '@wedevs/plugin-ui';
import { Check, Copy } from 'lucide-react';
import PrimaryLink from './PrimaryLink';
import { COUPON_CODE, premiumAsset, UPGRADE_URL } from './data';

const HeroBanner = () => {
	const [ copied, setCopied ] = useState( false );

	const copyCoupon = async () => {
		try {
			await navigator.clipboard.writeText( COUPON_CODE );
			setCopied( true );
			toast.success( __( 'Coupon code copied.', 'wepos' ) );
			setTimeout( () => setCopied( false ), 2000 );
		} catch {
			toast.error( __( 'Could not copy the coupon code.', 'wepos' ) );
		}
	};

	return (
		<div className="relative w-full max-w-[1216px] overflow-hidden rounded-[20px] bg-[#100844] px-10 py-[53px] lg:min-h-[345px]">
			<div className="relative z-10 flex max-w-[831px] flex-col gap-[57px] lg:h-[239px] lg:justify-between lg:gap-0">
				<div className="flex flex-col gap-4 text-white">
					<h1 className="m-0 text-[30px] font-bold leading-[1.3] text-white">
						{ __(
							'A Point of Sale Built for Growing Stores',
							'wepos'
						) }
					</h1>
					<p className="m-0 max-w-[580px] text-sm leading-[1.4] text-white">
						{ __(
							'Run your WooCommerce and Dokan store from a fast retail counter. Sell online and in person, sync every sale, and give each vendor their own POS.',
							'wepos'
						) }
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-5">
					<PrimaryLink href={ UPGRADE_URL }>
						{ __( 'Upgrade to Pro', 'wepos' ) }
					</PrimaryLink>

					<button
						type="button"
						onClick={ copyCoupon }
						className="inline-flex cursor-pointer items-center justify-center gap-3 rounded-md border border-[#3c434a] bg-transparent py-[9px] pl-[17px] pr-[15px] text-base font-medium text-[#a7aaad] transition-colors hover:text-white"
					>
						{ sprintf(
							/* translators: %s: coupon code. */
							__( 'Coupon: %s', 'wepos' ),
							COUPON_CODE
						) }
						{ copied ? (
							<Check className="size-5 shrink-0" />
						) : (
							<Copy className="size-5 shrink-0" />
						) }
					</button>
				</div>
			</div>

			<img
				src={ premiumAsset( 'hero-crown.png' ) }
				alt=""
				className="pointer-events-none absolute right-[74px] top-[30px] hidden h-[286px] w-[278px] max-w-none lg:block"
			/>

			<div className="pointer-events-none absolute right-[102px] top-[243px] hidden items-center justify-center rounded-full px-[33px] py-[11px] lg:flex bg-[linear-gradient(58deg,#2d4ed1_4%,#cf1eb4_85%,#ffaa00_103%)]">
				<span className="text-[24px] font-bold leading-[34px] text-white">
					{ __( 'Get 10% Extra Off', 'wepos' ) }
				</span>
			</div>
		</div>
	);
};

export default HeroBanner;
