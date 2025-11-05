import { useEffect, useRef } from 'react';
import { useOrderBookStore } from '@/store/useOrderBookStore'; // Use the base store

// (or 'wss://data-stream.binance.com/stream')
const BINANCE_WS_URL = 'wss://data-stream.binance.com/stream'; 

// 1. Accept 'symbol' as an argument
export const useBinanceSocket = (symbol: string) => {
  const ws = useRef<WebSocket | null>(null);
  const actionsRef = useRef<ReturnType<typeof useOrderBookStore.getState>['actions'] | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  
  // 2. 'isInitialConnectionRef' is removed, as we initialize every time
  //    the symbol changes and 'connect' is called.

  // 3. 'symbol' is added to the dependency array at the bottom
  useEffect(() => {
    // Get actions inside useEffect
    actionsRef.current = useOrderBookStore.getState().actions;
    
    let isMounted = true; 

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
      const actions = actionsRef.current;

      // 4. Always initialize the store on a new connection attempt
      actions.initializeStore();
      actions.setConnectionStatus('connecting');

      // 5. Use the dynamic 'symbol' prop
      const streams = [
        `${symbol}@depth`,    // Order Book Deltas
        `${symbol}@aggTrade`  // Aggregate Trades
      ];
      
      const socket = new WebSocket(`${BINANCE_WS_URL}?streams=${streams.join('/')}`);

      socket.onopen = () => {
        if (!isMounted || !actionsRef.current) return;
        console.log(`WebSocket connection established for ${symbol}`); // Added symbol
        isConnectingRef.current = false;
        actionsRef.current.setConnectionStatus('connected');
      };

      socket.onmessage = (event) => {
        if (!isMounted || !actionsRef.current) return;
        
        try {
          const message = JSON.parse(event.data);
          
          // 6. Use the dynamic 'symbol' prop
          if (message.stream === `${symbol}@depth`) {
            actionsRef.current.handleOrderBookDelta(message.data);
          } else if (message.stream === `${symbol}@aggTrade`) {
            actionsRef.current.addTrade(message.data);
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
        console.log(`WebSocket connection closed for ${symbol}`); // Added symbol
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

    // Initial connection
    connect();

    // Cleanup function
    return () => {
      console.log(`Cleaning up WebSocket for ${symbol} (unmounting)`); // Added symbol
      isMounted = false;
      isConnectingRef.current = false;
      
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
    
  // 7. Add 'symbol' to dependency array. This is the key change.
  }, [symbol]);
};