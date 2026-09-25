import { createContext } from 'react';

// The context objects live in their own file so the provider files only export
// components (keeps React Fast Refresh working). Read them with useAuth() / useCart().
export const AuthContext = createContext(null);
export const CartContext = createContext(null);
