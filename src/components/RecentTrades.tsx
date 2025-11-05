'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useOrderBookStore, OrderBookState, Trade } from '@/store/useOrderBookStore';

type HighlightDirection = 'buy' | 'sell' | 'none';

const RecentTrades: React.FC = () => {
  const trades = useOrderBookStore((state: OrderBookState) => state.trades);
  
  // 1. Get the current symbol from the store
  const symbol = useOrderBookStore((state: OrderBookState) => state.symbol);
  
  // 2. Create the dynamic coin name (e.g., "BTC", "ETH")
  const coinName = symbol.replace('usdt', '').toUpperCase();
  
  const [highlightedRow, setHighlightedRow] = useState<HighlightDirection>('none');
  const lastTradeIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (trades.length > 0) {
      const latestTrade = trades[0];
      
      if (latestTrade.a !== lastTradeIdRef.current) {
        const direction = latestTrade.m ? 'sell' : 'buy';
        setHighlightedRow(direction);
        lastTradeIdRef.current = latestTrade.a;

        const timer = setTimeout(() => {
          setHighlightedRow('none');
        }, 300);
        
        return () => clearTimeout(timer);
      }
    }
  }, [trades]);

  return (
    <div className="bg-gray-900 text-white p-3 sm:p-4 rounded-lg shadow-lg w-full font-mono flex flex-col h-[400px] lg:h-full lg:min-h-0">
      <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 text-center flex-shrink-0">Recent Trades</h3>
      <div className="flex justify-between text-[10px] sm:text-xs text-gray-400 mb-2 flex-shrink-0">
        <span className="w-1/3 text-center">Price (USDT)</span>
        {/* 3. Make heading dynamic */}
        <span className="w-1/3 text-center">Amount ({coinName})</span>
        <span className="w-1/3 text-center">Time</span>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {trades.map((trade, index) => {
          const tradeColor = trade.m ? 'text-red-500' : 'text-green-500';
          
          const highlightClass = 
            index === 0 && highlightedRow === 'buy' ? 'bg-green-700/50' :
            index === 0 && highlightedRow === 'sell' ? 'bg-red-700/50' :
            '';
            
          return (
            <div
              key={trade.a}
              className={`flex justify-between text-xs sm:text-sm p-1 transition-colors duration-100 ${highlightClass}`}
            >
              <span className={`w-1/3 text-center ${tradeColor}`}>{parseFloat(trade.p).toFixed(2)}</span>
              <span className="w-1/3 text-center">{parseFloat(trade.q).toFixed(4)}</span>
              <span className="w-1/3 text-center text-gray-500">
                {new Date(trade.T).toLocaleTimeString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentTrades;