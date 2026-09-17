import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Play } from 'lucide-react';
import PrimaryLink from './PrimaryLink';
import SectionHeading from './SectionHeading';
import {
	DOKAN_POS_DOC_URL,
	DOKAN_POS_VIDEO_ID,
	premiumAsset,
} from './data';

/**
 * Click-to-play facade: the poster frame is a local image and the YouTube
 * iframe is only mounted after a click, so nothing loads from youtube.com
 * until the admin asks for it.
 */
const VideoFrame = () => {
	const [ playing, setPlaying ] = useState( false );

	return (
		<div className="relative mx-auto aspect-video w-full max-w-[1000px] overflow-hidden rounded-[20px] bg-[#0d0733]">
			{ playing ? (
				<iframe
					src={ `https://www.youtube-nocookie.com/embed/${ DOKAN_POS_VIDEO_ID }?autoplay=1&rel=0` }
					title={ __( 'wePOS for Dokan marketplaces', 'wepos' ) }
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
					className="absolute inset-0 size-full border-0"
				/>
			) : (
				<button
					type="button"
					onClick={ () => setPlaying( true ) }
					aria-label={ __( 'Play the wePOS overview video', 'wepos' ) }
					className="group absolute inset-0 size-full cursor-pointer border-0 bg-transparent p-0"
				>
					<img
						src={ premiumAsset( 'dokan-pos.png' ) }
						alt=""
						className="absolute inset-0 size-full object-cover"
					/>
					<span className="absolute inset-0 flex items-center justify-center">
						<span className="flex size-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-all group-hover:scale-110 group-hover:bg-white">
							<Play className="size-6 translate-x-0.5 fill-[#4f39f6] text-[#4f39f6]" />
						</span>
					</span>
				</button>
			) }
		</div>
	);
};

const DokanPos = () => (
	<section className="flex w-full max-w-[1000px] flex-col items-center gap-11">
		<SectionHeading
			title={ __( 'Dokan Multivendor POS', 'wepos' ) }
			description={ __(
				'Run a marketplace? wePOS gives every vendor their own point of sale. Each seller manages their own products, customers, orders, and receipts, while you keep full control of the marketplace.',
				'wepos'
			) }
			className="max-w-[581px]"
		/>

		<VideoFrame />

		<PrimaryLink href={ DOKAN_POS_DOC_URL }>
			{ __( 'View Details', 'wepos' ) }
		</PrimaryLink>
	</section>
);

export default DokanPos;
