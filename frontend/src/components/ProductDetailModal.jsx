import React from 'react';

export default function ProductDetailModal({ selectedProduct, onClose }) {
  if (!selectedProduct) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        <img
          src={selectedProduct.image_url || 'https://via.placeholder.com/400x300'}
          alt={selectedProduct.name}
          className="w-full h-64 object-cover"
        />
        <div className="p-6">
          <span className="text-xs font-bold text-[#8A176E] uppercase tracking-wider">
            {selectedProduct.category}
          </span>
          <h2 className="text-2xl font-bold text-[#171317] mt-1">{selectedProduct.name}</h2>
          <p className="text-gray-600 mt-3 text-sm">{selectedProduct.description}</p>
          <div className="mt-6 flex items-center justify-between">
            <span className="text-2xl font-black text-[#64165D]">
              LKR {Number(selectedProduct.price).toLocaleString()}
            </span>
            <button
              onClick={onClose}
              className="bg-[#171317] text-white font-bold px-5 py-2 rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}