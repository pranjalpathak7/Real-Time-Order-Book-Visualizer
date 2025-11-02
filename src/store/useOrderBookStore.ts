import { create } from 'zustand';

// Define the types for our data
export type OrderBookEntry = [string, string];

// The 'm' property (isMaker) determines the trade direction
export interface Trade {
  T: number; // Trade time
  p: string; // Price
  q: string; // Amount
  m: boolean; // Is the buyer the market maker? (false = market buy, true = market sell)
  a: number; // Trade ID
}

// Define the state structure
export interface OrderBookState {
  bids: Map<string, string>;
  asks: Map<string, string>;
  trades: Trade[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  actions: {
    setConnectionStatus: (status: OrderBookState['connectionStatus']) => void;
    handleOrderBookDelta: (delta: { b: OrderBookEntry[], a: OrderBookEntry[] }) => void;
    addTrade: (trade: Trade) => void;
    initializeStore: () => void;
  };
}

// Helper function to update the order book map
const updateBook = (book: Map<string, string>, deltaEntries: OrderBookEntry[]) => {
  deltaEntries.forEach(([price, amount]) => {
    if (parseFloat(amount) === 0) {
      // Amount is '0', so remove this price level
      book.delete(price);
    } else {
      // Add or update the price level
      book.set(price, amount);
    }
  });
};

export const useOrderBookStore = create<OrderBookState>((set) => ({
  bids: new Map<string, string>(),
  asks: new Map<string, string>(),
  trades: [],
  connectionStatus: 'connecting',
  actions: {
    setConnectionStatus: (status) => set({ connectionStatus: status }),

    handleOrderBookDelta: (delta) => {
      set((state) => {
        // Create new maps to ensure immutability and trigger re-renders
        const newBids = new Map(state.bids);
        const newAsks = new Map(state.asks);

        updateBook(newBids, delta.b);
        updateBook(newAsks, delta.a);

        return { bids: newBids, asks: newAsks };
      });
    },

    addTrade: (trade) => {
      set((state) => {
        // Prevent duplicate trades by checking if trade ID already exists
        const existingTradeIndex = state.trades.findIndex(t => t.a === trade.a);
        
        // If trade already exists, don't add it again
        if (existingTradeIndex !== -1) {
          return state; // Return unchanged state to prevent re-render
        }
        
        // Add new trade to the front and keep only the last 50 trades
        return {
          trades: [trade, ...state.trades].slice(0, 50),
        };
      });
    },

    // Action to clear the store, e.g., on disconnect or symbol change
    initializeStore: () => {
      set({
        bids: new Map<string, string>(),
        asks: new Map<string, string>(),
        trades: [],
      });
    }
  }
}));

// Export actions separately for easier usage
export const useOrderBookActions = () => useOrderBookStore((state: OrderBookState) => state.actions);