'use client';

import React, { useMemo } from 'react';
import { useOrderBookStore, OrderBookState } from '@/store/useOrderBookStore';
import OrderBookRow from './OrderBookRow';

// Helper function
const processBookData = (book: Map<string, string>, sortOrder: 'asc' | 'desc') => {
  const entries = Array.from(book.entries());
  
  entries.sort(([priceA], [priceB]) => {
    return sortOrder === 'desc'
      ? parseFloat(priceB) - parseFloat(priceA)
      : parseFloat(priceA) - parseFloat(priceB);
  });

  let cumulativeTotal = 0;
  const processedData = entries.map(([price, amount]) => {
    cumulativeTotal += parseFloat(amount);
    return {
      price,
      amount,
      total: cumulativeTotal.toString(),
    };
  });
  
  return { processedData };
};

const OrderBook: React.FC = () => {
  const bids = useOrderBookStore((state: OrderBookState) => state.bids);
  const asks = useOrderBookStore((state: OrderBookState) => state.asks);

  const { processedData: processedBids } = useMemo(
    () => processBookData(bids, 'desc'),
    [bids]
  );
  
  const { processedData: processedAsks } = useMemo(
    () => processBookData(asks, 'asc'),
    [asks]
  );

  const spread = useMemo(() => {
    const lowestAsk = processedAsks[0]?.price;
    const highestBid = processedBids[0]?.price;

    if (lowestAsk && highestBid) {
      return (parseFloat(lowestAsk) - parseFloat(highestBid)).toFixed(2);
    }
    return '0.00';
  }, [processedAsks, processedBids]);

  const visibleBids = processedBids.slice(0, 15);
  const visibleAsks = processedAsks.slice(0, 15);

  const maxVisibleBidTotal = parseFloat(visibleBids[visibleBids.length - 1]?.total || '0');
  const maxVisibleAskTotal = parseFloat(visibleAsks[visibleAsks.length - 1]?.total || '0');

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg w-full font-mono">
      <div className="text-center text-xl font-bold mb-4">
        Spread: {spread}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* BIDS (Left Column) */}
        <div>
          <h2 className="text-lg font-semibold text-green-500 mb-2 text-center">Bids (BUY)</h2>
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span className="w-1/3 text-center">Price (USDT)</span>
            <span className="w-1/3 text-center">Amount (BTC)</span>
            <span className="w-1/3 text-center">Total (BTC)</span>
          </div>
          <div>
            {visibleBids.map(({ price, amount, total }) => (
              <OrderBookRow
                key={price}
                type="bid"
                price={price}
                amount={amount}
                total={total}
                depthPercent={Math.pow(parseFloat(total) / maxVisibleBidTotal, 2) * 100}
              />
            ))}
          </div>
        </div>

        {/* ASKS (Right Column) */}
        <div>
          <h2 className="text-lg font-semibold text-red-500 mb-2 text-center">Asks (SELL)</h2>
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span className="w-1/3 text-center">Price (USDT)</span>
            <span className="w-1G2 text-center">Amount (BTC)</span>
            <span className="w-1/3 text-center">Total (BTC)</span>
          </div>
          <div>
            {visibleAsks.map(({ price, amount, total }) => (
              <OrderBookRow
                key={price}
                type="ask"
                price={price}
                amount={amount}
                total={total}
                depthPercent={Math.pow(parseFloat(total) / maxVisibleAskTotal, 2) * 100}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;