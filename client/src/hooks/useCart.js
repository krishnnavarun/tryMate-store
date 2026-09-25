import { useContext } from 'react';
import { CartContext } from '../context/contexts.js';

// { cart, loaded, refresh, addItem, updateQty, removeItem }
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
}
