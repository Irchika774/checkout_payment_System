import React from 'react';

export default function ReservationBanner({ activeOrder, timer, formatTimer, onOpenPaymentModal }) {
  if (!activeOrder || activeOrder.status !== 'RESERVED') return null;

  return (
    <div className="bg-[#64165D] text-white p-4 rounded-xl shadow-md mb-8 flex flex-col sm:flex-row items-center justify-between border-2 border-[#8A176E]">
      <div>
        <p className="font-bold text-lg text-[#A7E8D7]">Stock Reservation Active</p>
        <p className="text-sm opacity-90">Order #{activeOrder.id.slice(0, 8)}... is held for you.</p>
      </div>
      <div className="flex items-center space-x-4 mt-4 sm:mt-0">
        <span className="text-2xl font-mono font-extrabold bg-[#171317] px-4 py-2 rounded-lg text-[#A7E8D7]">
          ⏳ {formatTimer(timer)}
        </span>
        <button
          onClick={onOpenPaymentModal}
          className="bg-[#8A176E] hover:bg-[#A7E8D7] hover:text-[#171317] text-white font-bold px-5 py-2 rounded-lg transition"
        >
          Complete Payment
        </button>
      </div>
    </div>
  );
}