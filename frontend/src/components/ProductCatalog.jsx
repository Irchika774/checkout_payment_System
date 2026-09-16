import React from 'react';

export default function ProductCatalog({ products, onAddToCart, onSelectProduct }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((p) => {
        const outOfStock = p.available_stock <= 0;
        return (
          <div
            key={p.id}
            className="bg-white rounded-2xl overflow-hidden border border-[#A7E8D7] shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="relative h-56 bg-gray-100">
              <img
                src={p.image_url || 'https://via.placeholder.com/400x300'}
                alt={p.name}
                className="w-full h-full object-cover"
              />
              <span
                className={`absolute top-3 right-3 px-3 py-1 text-xs font-bold rounded-full ${
                  outOfStock ? 'bg-red-500 text-white' : 'bg-[#A7E8D7] text-[#171317]'
                }`}
              >
                {outOfStock ? 'Out of Stock' : `${p.available_stock} Available`}
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#8A176E] uppercase tracking-wider">
                  {p.category}
                </span>
                <h3 className="text-xl font-bold text-[#171317] mt-1">{p.name}</h3>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{p.description}</p>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-xl font-black text-[#64165D]">
                  LKR {Number(p.price).toLocaleString()}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onSelectProduct(p)}
                    className="bg-[#C6F0E4] hover:bg-[#A7E8D7] text-[#171317] font-semibold px-3 py-2 rounded-lg text-xs transition"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => onAddToCart(p)}
                    disabled={outOfStock}
                    className={`px-4 py-2 rounded-lg font-bold text-sm text-white transition ${
                      outOfStock
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-[#64165D] hover:bg-[#8A176E] active:scale-95'
                    }`}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}