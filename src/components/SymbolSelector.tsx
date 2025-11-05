'use client';

import React from 'react';
import { useOrderBookStore, OrderBookState } from '@/store/useOrderBookStore';

// Define the symbols we want
const SYMBOLS = [
  { key: 'btcusdt', name: 'BTC' },
  { key: 'ethusdt', name: 'ETH' },
  { key: 'solusdt', name: 'SOL' },
  { key: 'dogeusdt', name: 'DOGE' },
];

const SymbolSelector: React.FC = () => {
  const currentSymbol = useOrderBookStore((state: OrderBookState) => state.symbol);
  const setSymbol = useOrderBookStore((state: OrderBookState) => state.actions.setSymbol);

  return (
    <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap">
      {SYMBOLS.map((symbol) => {
        const isActive = currentSymbol === symbol.key;
        return (
          <button
            key={symbol.key}
            onClick={() => setSymbol(symbol.key)}
            className={`
              px-2.5 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium
              transition-all
              ${isActive
                ? 'bg-blue-600 text-white shadow-md' // Active button: blue, white text, and a shadow
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200' // Inactive button: darker gray
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `}
          >
            {symbol.name}/USDT
          </button>
        );
      })}
    </div>
  );
};

export default SymbolSelector;