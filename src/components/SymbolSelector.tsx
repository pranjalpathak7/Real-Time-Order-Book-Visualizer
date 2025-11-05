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
  // Get the current symbol and the action to set it
  const currentSymbol = useOrderBookStore((state: OrderBookState) => state.symbol);
  const setSymbol = useOrderBookStore((state: OrderBookState) => state.actions.setSymbol);

  return (
    <div className="flex justify-center gap-2 mb-6">
      {SYMBOLS.map((symbol) => {
        const isActive = currentSymbol === symbol.key;
        return (
          <button
            key={symbol.key}
            onClick={() => setSymbol(symbol.key)}
            className={`
              px-4 py-2 rounded-lg font-semibold transition-all
              ${isActive
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }
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