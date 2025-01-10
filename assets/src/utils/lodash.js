import lodash from 'lodash/core';
import findIndex from 'lodash/findIndex';
import truncate from 'lodash/truncate';
import includes from 'lodash/fp/includes.js';
import debounce from 'lodash/fp/debounce.js';

_ = lodash.noConflict();
_.findIndex = findIndex;
_.truncate = truncate;
_.includes = includes;
_.debounce = debounce;

export default _;
