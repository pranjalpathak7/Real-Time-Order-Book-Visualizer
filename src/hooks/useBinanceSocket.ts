import { useEffect, useRef } from 'react';
import { useOrderBookStore } from '@/store/useOrderBookStore'; // Use the base store

// (or 'wss://data-stream.binance.com/stream')
const BINANCE_WS_URL = 'wss://data-stream.binance.com/stream'; 
const SYMBOL = 'btcusdt';

export const useBinanceSocket = () => {
  const ws = useRef<WebSocket | null>(null);
  const actionsRef = useRef<ReturnType<typeof useOrderBookStore.getState>['actions'] | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const isInitialConnectionRef = useRef<boolean>(true);

  useEffect(() => {
    // Get actions inside useEffect to ensure we have the latest references
    // and to avoid calling getState() during render
    actionsRef.current = useOrderBookStore.getState().actions;
    
    // A flag to prevent reconnects on a "clean" unmount
    let isMounted = true; 

    // Move the connect function INSIDE the useEffect
    const connect = () => {
      
      // Prevent multiple simultaneous connection attempts
      if (!isMounted || !actionsRef.current || isConnectingRef.current) {
        return;
      }

      // Close existing connection if any
      if (ws.current) {
        try {
          ws.current.close();
        } catch (e) {
          // Ignore errors during cleanup
        }
        ws.current = null;
      }

      // Clear any pending reconnection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      isConnectingRef.current = true;
      const actions = actionsRef.current;

      // Clear previous state on new connection attempt (only on first connect)
      if (isInitialConnectionRef.current) {
        actions.initializeStore();
        isInitialConnectionRef.current = false;
      }
      actions.setConnectionStatus('connecting');

      const streams = [
        `${SYMBOL}@depth`,    // Order Book Deltas
        `${SYMBOL}@aggTrade`  // Aggregate Trades
      ];
      
      const socket = new WebSocket(`${BINANCE_WS_URL}?streams=${streams.join('/')}`);

      socket.onopen = () => {
        if (!isMounted || !actionsRef.current) return;
        console.log('WebSocket connection established');
        isConnectingRef.current = false;
        actionsRef.current.setConnectionStatus('connected');
      };

      socket.onmessage = (event) => {
        if (!isMounted || !actionsRef.current) return;
        
        try {
          const message = JSON.parse(event.data);
          
          if (message.stream === `${SYMBOL}@depth`) {
            actionsRef.current.handleOrderBookDelta(message.data);
          } else if (message.stream === `${SYMBOL}@aggTrade`) {
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
        console.log('WebSocket connection closed');
        isConnectingRef.current = false;
        if (actionsRef.current) {
          actionsRef.current.setConnectionStatus('disconnected');
        }
        
        // Only reconnect if the component is still mounted
        if (isMounted) {
          console.log('Attempting to reconnect in 5s...');
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
              connect();
            }
          }, 5000); // 5-second reconnect delay
        }
      };

      ws.current = socket;
    };

    // Initial connection
    connect();

    // Cleanup function
    return () => {
      console.log('Cleaning up WebSocket (unmounting)');
      isMounted = false; // Set flag on unmount
      isConnectingRef.current = false;
      
      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close WebSocket
      if (ws.current) {
        try {
          ws.current.close();
        } catch (e) {
          // Ignore errors during cleanup
        }
        ws.current = null;
      }
      
      actionsRef.current = null;
    };
    
  // Empty dependency array - this effect should only run once on mount
  }, []);
};