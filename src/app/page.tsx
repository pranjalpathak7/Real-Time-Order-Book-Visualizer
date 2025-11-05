'use client';

import { useBinanceSocket } from '@/hooks/useBinanceSocket';
import OrderBook from '@/components/OrderBook';
import RecentTrades from '@/components/RecentTrades';
import SymbolSelector from '@/components/SymbolSelector'; // 1. Import new component
import { useOrderBookStore, OrderBookState } from '@/store/useOrderBookStore';
import React from 'react';

// A simple component to show connection status
const ConnectionStatus: React.FC = () => {
  const status = useOrderBookStore((state: OrderBookState) => state.connectionStatus);
  
  let color = 'text-yellow-500'; // connecting
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
  // 2. Read symbol from store
  const symbol = useOrderBookStore((state: OrderBookState) => state.symbol);

  // 3. Pass symbol to the hook
  useBinanceSocket(symbol);

  // 4. Create a nice display name
  const displaySymbol = symbol.replace('usdt', '/USDT').toUpperCase();

  return (
    <main
      className={`flex h-screen flex-col items-center p-8 font-sans`}
    >
      <div className="w-full max-w-7xl z-10 flex flex-col h-full">
        {/* Header margin bottom changed to mb-4 */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-4 flex-shrink-0">
          {/* 5. Update H1 to be dynamic */}
          <h1 className="text-3xl font-bold mb-2 sm:mb-0">
            {displaySymbol} Order Book
          </h1>
          <ConnectionStatus />
        </header>

        {/* 6. Add the new SymbolSelector component */}
        {/* Added flex-shrink-0 to prevent this from shrinking */}
        <div className="flex-shrink-0">
          <SymbolSelector />
        </div>

        {/* Added mt-4 to add space, and kept flex-1 min-h-0 */}
        <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0 mt-4">
          <div className="lg:flex-1">
            <OrderBook />
          </div>
          <div className="w-full lg:w-[384px] flex flex-col">
            <RecentTrades />
          </div>
        </div>
      </div>
    </main>
  );
}