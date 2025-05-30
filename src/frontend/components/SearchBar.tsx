import React from 'react';
import { __ } from '@wordpress/i18n';

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
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>
      </div>
    </div>
  );
};

export default SearchBar;
