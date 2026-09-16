import React from 'react';

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onCheckout,
  loading,
}) {
  if (!isOpen) return null;

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex justify-end">
      <div className="bg-white w-full max-w-md h-full p-6 flex flex-col justify-between shadow-2xl">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-[#171317]">Your Cart</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-black font-bold text-xl">
              ✕
            </button>
          </div>

          <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Your cart is empty.</p>
            ) : (
              cart.map((item) => (
                <div key={item.product_id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h4 className="font-bold text-[#171317]">{item.name}</h4>
                    <p className="text-sm font-semibold text-[#64165D]">
                      LKR {Number(item.price).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                      className="bg-[#C6F0E4] hover:bg-[#A7E8D7] text-[#171317] font-bold px-2 py-0.5 rounded"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                      className="bg-[#C6F0E4] hover:bg-[#A7E8D7] text-[#171317] font-bold px-2 py-0.5 rounded"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between font-black text-xl text-[#171317] mb-4">
            <span>Total:</span>
            <span>LKR {cartTotal.toLocaleString()}</span>
          </div>
          <button
            onClick={onCheckout}
            disabled={cart.length === 0 || loading}
            className="w-full bg-[#64165D] hover:bg-[#8A176E] text-white font-bold py-3 rounded-xl transition shadow-lg disabled:bg-gray-300"
          >
            {loading ? 'Reserving Stock...' : 'Reserve Stock & Proceed'}
          </button>
        </div>
      </div>
    </div>
  );
}