import { useEffect, useRef } from 'react';
import { useOrderBookStore, Trade } from '@/store/useOrderBookStore'; // Use the base store

const BINANCE_WS_URL = 'wss://data-stream.binance.com/stream'; 

export const useBinanceSocket = (symbol: string) => {
  const ws = useRef<WebSocket | null>(null);
  const actionsRef = useRef<ReturnType<typeof useOrderBookStore.getState>['actions'] | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  
  // 1. NEW: Create a buffer for trades
  const tradeBufferRef = useRef<Trade[]>([]);
  // 2. NEW: Create a ref for the interval timer
  const flushIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    actionsRef.current = useOrderBookStore.getState().actions;
    const actions = actionsRef.current;
    
    let isMounted = true; 

    // 3. NEW: Set up a buffer flusher that runs every 200ms
    flushIntervalRef.current = setInterval(() => {
      if (isMounted && actionsRef.current && tradeBufferRef.current.length > 0) {
        // Send the entire buffer to the store
        actionsRef.current.addTrades(tradeBufferRef.current);
        // Clear the buffer
        tradeBufferRef.current = [];
      }
    }, 200); // <-- Batching interval

    const connect = () => {
      
      if (!isMounted || !actionsRef.current || isConnectingRef.current) {
        return;
      }

      if (ws.current) {
        try {
          ws.current.close();
        } catch (e) {
          // Ignore errors
        }
        ws.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      isConnectingRef.current = true;
      actions.initializeStore();
      actions.setConnectionStatus('connecting');

      const streams = [
        `${symbol}@depth`,
        `${symbol}@aggTrade`
      ];
      
      const socket = new WebSocket(`${BINANCE_WS_URL}?streams=${streams.join('/')}`);

      socket.onopen = () => {
        if (!isMounted || !actionsRef.current) return;
        console.log(`WebSocket connection established for ${symbol}`);
        isConnectingRef.current = false;
        actionsRef.current.setConnectionStatus('connected');
      };

      socket.onmessage = (event) => {
        if (!isMounted || !actionsRef.current) return;
        
        try {
          const message = JSON.parse(event.data);
          
          if (message.stream === `${symbol}@depth`) {
            actionsRef.current.handleOrderBookDelta(message.data);
          } else if (message.stream === `${symbol}@aggTrade`) {
            // 4. CHANGED: Push to buffer instead of calling action directly
            tradeBufferRef.current.push(message.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onerror = (error) => {
        if (!isMounted) return;
        console.error('WebSocket error:', error);
        isConnectingRef.current = false;
        if (actionsRef.current) {
          actionsRef.current.setConnectionStatus('disconnected');
        }
      };

      socket.onclose = () => {
        if (!isMounted) return;
        console.log(`WebSocket connection closed for ${symbol}`);
        isConnectingRef.current = false;
        if (actionsRef.current) {
          actionsRef.current.setConnectionStatus('disconnected');
        }
        
        if (isMounted) {
          console.log('Attempting to reconnect in 5s...');
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
              connect();
            }
          }, 5000);
        }
      };

      ws.current = socket;
    };

    connect();

    // Cleanup function
    return () => {
      console.log(`Cleaning up WebSocket for ${symbol} (unmounting)`);
      isMounted = false;
      isConnectingRef.current = false;
      
      // 5. NEW: Clear the interval timer on cleanup
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (ws.current) {
        try {
          ws.current.close();
        } catch (e) {
          // Ignore
        }
        ws.current = null;
      }
      
      actionsRef.current = null;
    };
    
  }, [symbol]); // This is correct
};