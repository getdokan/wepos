/**
 * This file contains mappings for external and handle names for packages.
 */

const WEPOS_NAMESPACE = '@wepos/';

/**
 * Given a string, returns a new string with dash separators converted to
 * camelCase equivalent.
 *
 * @param {string} string Input dash-delimited string.
 *
 * @return {string} Camel-cased string.
 */
function camelCaseDash( string ) {
    return string.replace( /-([a-z])/g, ( _, letter ) => letter.toUpperCase() );
}

/**
 * Given a request string, returns the external name for the packages.
 *
 * @param {string} request Request string.
 *
 * @return {string[]|undefined} External name for the package.
 */
const requestToExternal = ( request ) => {
    if ( request.startsWith( WEPOS_NAMESPACE ) ) {
        const packageName = request.substring( WEPOS_NAMESPACE.length );
        const handleName = packageName === 'utils' ? 'components' : packageName;

        return [ 'wepos', 'wepos-' + handleName ];
    }
};

/**
 * Given a request string, returns the handle name.
 *
 * @param {string} request Request string.
 *
 * @return {string|undefined} Handle name for the package.
 */
const requestToHandle = ( request ) => {
    if ( request.startsWith( WEPOS_NAMESPACE ) ) {
        const packageName = request.substring( WEPOS_NAMESPACE.length );
        const mapping = {
            components: 'react-components',
            utils: 'react-components',
        };
        const handleName = mapping[ packageName ] || packageName;
        return `wepos-${ handleName }`;
    }
};

module.exports = {
    requestToExternal,
    requestToHandle,
};
