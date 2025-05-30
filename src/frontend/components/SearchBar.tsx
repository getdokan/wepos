import React from 'react';
import { __ } from '@wordpress/i18n';
import { Search } from 'lucide-react';

const SearchBar: React.FC = () => {
  return (
    <div className="relative w-full flex-1 md:w-auto">
      <div className="relative">
        <input
          type="text"
          id="product-search"
          placeholder={__('Search products...', 'wepos')}
          className="focus:ring-wepos-primary/20 focus:border-wepos-primary h-10 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 transition-colors focus:ring-2"
        />
        <span className="text-wepos-primary hover:text-wepos-primary-hover absolute top-1/2 right-3 -translate-y-1/2 transform cursor-pointer transition-colors">
          <Search className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
};

export default SearchBar;
