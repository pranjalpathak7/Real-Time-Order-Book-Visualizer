# Real-Time Order Book Visualizer

This is a high-performance, real-time stock order book visualizer built for the Two Cents Ventures frontend engineering assignment. It connects to the live Binance WebSocket API to stream and display market data for BTC/USDT.

A live demo is hosted on Vercel: 

## Features

-   **Live Data:** Connects to the Binance WebSocket API for two streams:
    -   `@depth`: Real-time order book deltas.
    -   `@aggTrade`: Real-time aggregate trades.
-   **High-Performance Order Book:**
    -   Displays Bids (descending) and Asks (ascending).
    -   Calculates cumulative totals for both sides.
    -   Visualizes market depth with a relative background bar.
    -   Clearly displays the live **Spread**.
-   **Recent Trades:**
    -   Shows the 50 most recent market trades.
    -   Highlights new trades instantly (Green for market buy, Red for market sell).
-   **Robust Connection:** Automatically attempts to reconnect if the WebSocket connection is lost.

## Tech Stack

-   **Framework:** Next.js (App Router)
-   **Language:** TypeScript
-   **State Management:** Zustand
-   **Styling:** Tailwind CSS

## Running the Project Locally

1.  **Clone the repository:**
    ```bash
    git clone [your-repo-url]
    cd [your-repo-name]
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    *(Note: The only external dependency added was `zustand`)*

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:3000`.

## Design Choices & Trade-offs

1.  **State Management (Zustand):**
    -   I chose **Zustand** over Context or `useReducer` to manage the high-frequency state from the WebSocket.
    -   **Why:** Zustand decouples state from the React component tree. This means I can update the `bids`, `asks`, and `trades` in the store at a very high frequency *without* causing the entire React application to re-render on every single update. Components subscribe *only* to the specific slices of state they need, enabling minimal, surgical re-renders.

2.  **Data Structure (`Map`):**
    -   The order book `bids` and `asks` are stored in `Map` objects (`Map<price, amount>`).
    -   **Why:** The API provides deltas, not the full order book. A `Map` is the ideal data structure for this, providing average-case **$O(1)$** performance for adding, updating, and (most importantly) *deleting* price levels. This is far more efficient than finding and updating items in a large array.

3.  **Performance & Memoization:**
    -   **`React.memo`:** The `OrderBookRow` component is wrapped in `React.memo`. Since the `OrderBook` list might have many rows, this prevents unchanged rows from re-rendering when the data around them changes.
    -   **`useMemo`:** The expensive logic (converting the `Map` to a sorted array, calculating cumulative totals, and calculating the spread) is wrapped in `useMemo`. This ensures these heavy calculations *only* run when the raw `bids` or `asks` maps actually change, not on every component render.
    -   **Selectors:** Components use scoped selectors (e.g., `useOrderBookStore((state) => state.trades)`) to subscribe *only* to the data they need, further preventing unnecessary re-renders.

4.  **Trade Highlighting:**
    -   The `RecentTrades` component uses a `useRef` to store the ID of the most recent trade. An `useEffect` hook compares the new incoming trade ID to the ref.
    -   **Why:** This allows the component to trigger a "highlight" state *only* when a genuinely new trade arrives, not just when the `trades` array (which is a new array on every update) causes a re-render.