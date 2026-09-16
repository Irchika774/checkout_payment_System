import React from 'react';

export default function ProductSearchFilter({
  search,
  setSearch,
  category,
  setCategory,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  inStockOnly,
  setInStockOnly,
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#A7E8D7] mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
      <input
        type="text"
        placeholder="🔍 Search items..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#8A176E]"
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#8A176E]"
      >
        <option value="All">All Categories</option>
        <option value="Apparel">Apparel</option>
        <option value="Electronics">Electronics</option>
        <option value="Home & Living">Home & Living</option>
      </select>

      <div className="flex space-x-2">
        <input
          type="number"
          placeholder="Min LKR"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="w-1/2 p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#8A176E]"
        />
        <input
          type="number"
          placeholder="Max LKR"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-1/2 p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#8A176E]"
        />
      </div>

      <label className="flex items-center justify-center space-x-2 bg-[#C6F0E4] p-3 rounded-xl cursor-pointer border border-[#A7E8D7]">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => setInStockOnly(e.target.checked)}
          className="accent-[#64165D] w-5 h-5"
        />
        <span className="font-semibold text-sm">In-Stock Only</span>
      </label>
    </div>
  );
}