import { useCallback, useEffect, useMemo, useState } from 'react';
import * as cartApi from '../api/cart.js';
import { useAuth } from '../hooks/useAuth.js';
import { CartContext } from './contexts.js';

const EMPTY_CART = { items: [], itemCount: 0, subtotal: 0, hasStockIssues: false };

// Holds the logged-in user's cart. The server does all the maths (prices, totals,
// stock); every action returns the full cart and we just store it.
export default function CartProvider({ children }) {
  const { user } = useAuth();
  const userId = user?._id ?? null;

  // Remember whose cart this is, so after logout/login we never show someone else's cart
  const [state, setState] = useState({ userId: null, cart: EMPTY_CART });

  const refresh = useCallback(async () => {
    if (!userId) return;
    const cart = await cartApi.fetchCart();
    setState({ userId, cart });
  }, [userId]);

  // Load the cart whenever a (different) user logs in
  useEffect(() => {
    if (!userId) return;
    cartApi
      .fetchCart()
      .then((cart) => setState({ userId, cart }))
      .catch(() => {}); // the header just shows 0; pages that need the cart show their own errors
  }, [userId]);

  const addItem = useCallback(
    async (item) => setState({ userId, cart: await cartApi.addCartItem(item) }),
    [userId],
  );
  const updateQty = useCallback(
    async (itemId, qty) => setState({ userId, cart: await cartApi.updateCartItem(itemId, qty) }),
    [userId],
  );
  const removeItem = useCallback(
    async (itemId) => setState({ userId, cart: await cartApi.removeCartItem(itemId) }),
    [userId],
  );

  const cart = userId && state.userId === userId ? state.cart : EMPTY_CART;
  const loaded = !userId || state.userId === userId;

  const value = useMemo(
    () => ({ cart, loaded, refresh, addItem, updateQty, removeItem }),
    [cart, loaded, refresh, addItem, updateQty, removeItem],
  );

  return <CartContext value={value}>{children}</CartContext>;
}
