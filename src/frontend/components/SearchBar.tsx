import React from 'react';
import { __ } from '@wordpress/i18n';
import { Search } from 'lucide-react';
import { Input } from '@wedevs/plugin-ui';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="relative w-full flex-1 md:w-64">
      <div className="relative flex items-center">
        <Search className="text-muted-foreground absolute left-3 h-4 w-4" />
        <Input
          type="text"
          id="product-search"
          placeholder={__('Search products...', 'wepos')}
          className="h-10 pl-10 pr-4 bg-transparent border-none shadow-none focus-visible:ring-0 focus-visible:border-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default SearchBar;
