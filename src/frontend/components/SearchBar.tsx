import React from 'react';
import { __ } from '@wordpress/i18n';
import { Search } from 'lucide-react';

const SearchBar: React.FC = () => {
  return (
    <div className="wepos-search-bar">
      <div className="relative">
        <input
          type="text"
          id="product-search"
          placeholder={__('Search products...', 'wepos')}
          className="wepos-input pr-10"
        />
        <span className="text-wepos-primary hover:text-wepos-primary-hover absolute top-1/2 right-3 -translate-y-1/2 transform cursor-pointer transition-colors">
          <Search className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
};

export default SearchBar;
