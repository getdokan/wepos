import React from 'react';
import { __ } from '@wordpress/i18n';
import { Search } from 'lucide-react';
import { Input } from '@wedevs/plugin-ui';

const SearchBar: React.FC = () => {
  return (
    <div className="relative w-full flex-1 md:w-64">
      <div className="relative flex items-center">
        <Search className="text-muted-foreground absolute left-3 h-4 w-4" />
        <Input
          type="text"
          id="product-search"
          placeholder={__('Search products...', 'wepos')}
          className="h-10 pl-10 pr-4 bg-transparent border-none shadow-none focus-visible:ring-0 focus-visible:border-none"
        />
      </div>
    </div>
  );
};

export default SearchBar;
