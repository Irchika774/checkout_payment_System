import React from 'react';

export default function OrderHistory({ orders, onCancelOrder, onRefundOrder }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-[#A7E8D7] shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-[#171317]">Your Order History</h2>
      {orders.length === 0 ? (
        <p className="text-gray-500">No past orders found.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="border border-gray-200 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center bg-[#C6F0E4]/30"
            >
              <div>
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-[#64165D]">#{o.id.slice(0, 8)}...</span>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-extrabold ${
                      o.status === 'PAID'
                        ? 'bg-[#A7E8D7] text-[#171317]'
                        : o.status === 'RESERVED'
                        ? 'bg-amber-200 text-amber-900'
                        : o.status === 'CANCELLED' || o.status === 'REFUNDED'
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {o.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(o.created_at).toLocaleString()}
                </p>
              </div>

              <div className="mt-4 md:mt-0 flex items-center space-x-6">
                <span className="font-black text-lg text-[#171317]">
                  LKR {Number(o.total_amount).toLocaleString()}
                </span>

                {o.status === 'RESERVED' && (
                  <button
                    onClick={() => onCancelOrder(o.id)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition"
                  >
                    Cancel Order
                  </button>
                )}

                {o.status === 'PAID' && (
                  <button
                    onClick={() => onRefundOrder(o.id)}
                    className="bg-[#8A176E] hover:bg-[#64165D] text-white font-bold px-4 py-1.5 rounded-lg text-xs transition"
                  >
                    Simulate Refund
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}