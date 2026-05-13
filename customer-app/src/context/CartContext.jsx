import {
  createContext,
  useContext,
  useState
} from 'react';

const CartContext = createContext();

export function CartProvider({
  children
}) {
  const [cart, setCart] =
    useState([]);

  const addToCart = item => {
    setCart(prev => {
      const existing =
        prev.find(
          cartItem =>
            cartItem.id ===
            item.id
        );

      if (existing) {
        return prev.map(
          cartItem =>
            cartItem.id ===
              item.id
              ? {
                ...cartItem,
                qty:
                  cartItem.qty +
                  1
              }
              : cartItem
        );
      }

      return [
        ...prev,
        {
          ...item,
          qty: 1
        }
      ];
    });
  };

  const removeFromCart = id => {
    setCart(prev =>
      prev.filter(
        item => item.id !== id
      )
    );
  };

  const increaseQty = id => {
    setCart(prev =>
      prev.map(item =>
        item.id === id
          ? {
            ...item,
            qty:
              item.qty +
              1
          }
          : item
      )
    );
  };

  const decreaseQty = id => {
    setCart(prev =>
      prev
        .map(item =>
          item.id === id
            ? {
              ...item,
              qty:
                item.qty -
                1
            }
            : item
        )
        .filter(
          item => item.qty > 0
        )
    );
  };

  const clearCart = () =>
    setCart([]);

  const cartCount =
    cart.reduce(
      (sum, item) =>
        sum + item.qty,
      0
    );

  const cartTotal =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price * item.qty,
      0
    );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQty,
        decreaseQty,
        clearCart,
        cartCount,
        cartTotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () =>
  useContext(CartContext);