import React from 'react';

export default function NotificationBanner({ message }) {
  if (!message) return null;

  return (
    <div
      className={`py-3 px-6 text-center font-semibold text-sm transition-all ${
        message.type === 'success' ? 'bg-[#A7E8D7] text-[#171317]' : 'bg-red-500 text-white'
      }`}
    >
      {message.text}
    </div>
  );
}