'use client';

import { useBinanceSocket } from '@/hooks/useBinanceSocket';
import OrderBook from '@/components/OrderBook';
import RecentTrades from '@/components/RecentTrades';
import SymbolSelector from '@/components/SymbolSelector';
import { useOrderBookStore, OrderBookState } from '@/store/useOrderBookStore';
import React from 'react';

// ConnectionStatus component (no change)
const ConnectionStatus: React.FC = () => {
  const status = useOrderBookStore((state: OrderBookState) => state.connectionStatus);
  
  let color = 'text-yellow-500';
  let dotColor = 'bg-yellow-500';
  if (status === 'connected') {
    color = 'text-green-500';
    dotColor = 'bg-green-500';
  }
  if (status === 'disconnected') {
    color = 'text-red-500';
    dotColor = 'bg-red-500';
  }

  return (
    <div className="flex items-center space-x-2">
      <span className={`h-3 w-3 rounded-full ${dotColor}`}></span>
      <span className={`font-medium ${color} capitalize`}>{status}</span>
    </div>
  );
};

export default function Home() {
  const symbol = useOrderBookStore((state: OrderBookState) => state.symbol);
  useBinanceSocket(symbol);
  const displaySymbol = symbol.replace('usdt', '/USDT').toUpperCase();

  return (
    <main
      className={`flex min-h-screen lg:h-screen flex-col items-center p-4 sm:p-6 lg:p-8 font-sans`}
    >
      <div className="w-full max-w-7xl z-10 flex flex-col lg:h-full">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-3 sm:mb-4 lg:flex-shrink-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-0">
            {displaySymbol} Order Book
          </h1>
          <ConnectionStatus />
        </header>

        <div className="lg:flex-shrink-0 mb-3 sm:mb-4">
          <SymbolSelector />
        </div>

        {/* CHANGED: Removed mt-4 to pull the components up */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 lg:flex-1 lg:min-h-0">
          <div className="lg:flex-1">
            <OrderBook />
          </div>
          <div className="w-full lg:w-[384px] flex flex-col lg:min-h-0">
            <RecentTrades />
          </div>
        </div>
      </div>
    </main>
  );
}