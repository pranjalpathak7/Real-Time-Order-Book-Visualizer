import React from 'react';

interface OrderBookRowProps {
  type: 'bid' | 'ask';
  price: string;
  amount: string;
  total: string;
  depthPercent: number; // 0 to 100
}

const OrderBookRow: React.FC<OrderBookRowProps> = ({ type, price, amount, total, depthPercent }) => {
  const priceColor = type === 'bid' ? 'text-green-500' : 'text-red-500';
  const bgDepthColor = type === 'bid' ? 'bg-green-900/50' : 'bg-red-900/50';

  return (
    <div className="relative flex justify-between items-center text-sm p-1">
      {/* Depth background bar*/}
      <div
        className={`absolute top-0 bottom-0 ${type === 'bid' ? 'right-0' : 'left-0'} ${bgDepthColor} h-full z-0 transition-all duration-300 ease-in-out`}
        style={{ width: `${depthPercent}%` }}
      />
      
      {/* Content */}
      <div className={`z-10 w-1/3 text-center ${priceColor}`}>{parseFloat(price).toFixed(2)}</div>
      <div className="z-10 w-1/3 text-center">{parseFloat(amount).toFixed(4)}</div>
      <div className="z-10 w-1/3 text-center">{parseFloat(total).toFixed(4)}</div>
    </div>
  );
};

export default React.memo(OrderBookRow);