import React from 'react';

const SearchBar: React.FC = () => {
  return (
    <div className="search-bar">
      <div className="search-box">
        <input
          type="text"
          id="product-search"
          placeholder="Search Product By Name, Barcode, SKU..."
        />
        <span className="search-icon flaticon-search"></span>
      </div>
    </div>
  );
};

export default SearchBar;
