import React from 'react';

export default function PaymentGatewayModal({
  isOpen,
  activeOrder,
  timer,
  formatTimer,
  onProcessPayment,
  loading,
}) {
  if (!isOpen || !activeOrder) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border-2 border-[#8A176E]">
        <h3 className="text-2xl font-bold text-[#171317]">Mock Payment Gateway</h3>
        <p className="text-sm text-gray-500 mt-1">Order #{activeOrder.id.slice(0, 8)}...</p>

        <div className="my-6 bg-[#C6F0E4] p-4 rounded-xl">
          <p className="text-xs text-gray-600 uppercase tracking-wider font-bold">Total Payable</p>
          <p className="text-3xl font-black text-[#64165D] mt-1">
            LKR {Number(activeOrder.total_amount).toLocaleString()}
          </p>
          <p className="text-xs text-[#8A176E] font-bold mt-2">
            ⏳ Time Remaining: {formatTimer(timer)}
          </p>
        </div>

        <p className="text-xs text-gray-500 mb-4">Simulate a payment outcome:</p>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onProcessPayment('SUCCESS')}
            disabled={loading}
            className="bg-[#A7E8D7] hover:bg-[#64165D] hover:text-white text-[#171317] font-bold py-3 rounded-xl transition text-sm"
          >
            Success
          </button>
          <button
            onClick={() => onProcessPayment('FAIL')}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition text-sm"
          >
            Fail
          </button>
          <button
            onClick={() => onProcessPayment('TIMEOUT')}
            disabled={loading}
            className="bg-gray-700 hover:bg-black text-white font-bold py-3 rounded-xl transition text-sm"
          >
            Timeout
          </button>
        </div>
      </div>
    </div>
  );
}