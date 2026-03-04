import { __ } from '@wordpress/i18n';
import { useParams, useLocation } from 'react-router-dom';

const Placeholder = () => {
	const location = useLocation();
	const pageName = location.pathname.replace( /^\//, '' ) || 'page';

	return (
		<div className="wepos-admin-placeholder p-6">
			<h2 className="text-xl font-semibold mb-4 capitalize">
				{ pageName }
			</h2>
			<p className="text-muted-foreground">
				{ __( 'React version of this page is coming soon.', 'wepos' ) }
			</p>
		</div>
	);
};

export default Placeholder;
