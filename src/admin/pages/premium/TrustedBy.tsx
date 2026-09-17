import { __ } from '@wordpress/i18n';
import { premiumAsset } from './data';

const TrustedBy = () => (
	<section className="flex flex-col items-center gap-14">
		<h2 className="m-0 text-center text-[30px] font-bold leading-[1.3] text-[#1f2937]">
			{ __( 'From the trusted team behind:', 'wepos' ) }
		</h2>

		<div className="w-full overflow-x-auto">
			<img
				src={ premiumAsset( 'trusted-logos.svg' ) }
				alt={ __(
					'Dokan, WP User Frontend, WP ERP, WP Project Manager Pro, FlyWP, WP Hive and weMail',
					'wepos'
				) }
				className="mx-auto block h-[42px] w-[1013px] max-w-none"
			/>
		</div>
	</section>
);

export default TrustedBy;
