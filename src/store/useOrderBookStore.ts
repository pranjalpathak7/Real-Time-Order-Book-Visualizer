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
  symbol: string;
  bids: Map<string, string>;
  asks: Map<string, string>;
  trades: Trade[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  actions: {
    setSymbol: (symbol: string) => void;
    setConnectionStatus: (status: OrderBookState['connectionStatus']) => void;
    handleOrderBookDelta: (delta: { b: OrderBookEntry[], a: OrderBookEntry[] }) => void;
    addTrades: (trades: Trade[]) => void; // CHANGED: from addTrade to addTrades
    initializeStore: () => void;
  };
}

// Helper function to update the order book map
const updateBook = (book: Map<string, string>, deltaEntries: OrderBookEntry[]) => {
  deltaEntries.forEach(([price, amount]) => {
    if (parseFloat(amount) === 0) {
      book.delete(price);
    } else {
      book.set(price, amount);
    }
  });
};

export const useOrderBookStore = create<OrderBookState>((set) => ({
  symbol: 'btcusdt',
  bids: new Map<string, string>(),
  asks: new Map<string, string>(),
  trades: [],
  connectionStatus: 'connecting',
  actions: {
    setSymbol: (symbol) => set({ symbol }),

    setConnectionStatus: (status) => set({ connectionStatus: status }),

    handleOrderBookDelta: (delta) => {
      set((state) => {
        const newBids = new Map(state.bids);
        const newAsks = new Map(state.asks);
        updateBook(newBids, delta.b);
        updateBook(newAsks, delta.a);
        return { bids: newBids, asks: newAsks };
      });
    },

    // NEW: Batch-processing addTrades function
    addTrades: (trades) => {
      set((state) => {
        // Create a new array from existing trades
        const newTrades = [...state.trades];
        let added = false;

        // Iterate new trades (which are already in order)
        for (const trade of trades) {
          // Check if this trade ID already exists
          const existing = newTrades.find(t => t.a === trade.a);
          
          if (!existing) {
            // Add new trade to the front
            newTrades.unshift(trade);
            added = true;
          }
        }

        // If no new trades were actually added, don't update state
        if (!added) {
          return state;
        }

        // Return the new, sliced array
        return {
          trades: newTrades.slice(0, 50),
        };
      });
    },

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