import React from 'react';

export default function Navbar({ activeTab, setActiveTab, cartItemCount, setIsCartOpen }) {
  return (
    <header className="bg-[#171317] text-white sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="bg-[#8A176E] text-[#C6F0E4] p-2 rounded-lg font-black text-xl">TL</span>
          <h1 className="text-2xl font-bold tracking-tight text-[#C6F0E4]">Aura Storefront</h1>
        </div>

        <div className="flex items-center space-x-6">
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'shop' ? 'bg-[#64165D] text-[#C6F0E4]' : 'hover:text-[#A7E8D7]'
            }`}
          >
            Catalog
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'orders' ? 'bg-[#64165D] text-[#C6F0E4]' : 'hover:text-[#A7E8D7]'
            }`}
          >
            Order History
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative bg-[#8A176E] hover:bg-[#64165D] text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition shadow-md"
          >
            <span>🛒 Cart</span>
            <span className="bg-[#A7E8D7] text-[#171317] font-bold text-xs px-2 py-0.5 rounded-full">
              {cartItemCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}