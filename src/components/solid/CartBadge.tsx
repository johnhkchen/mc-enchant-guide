// src/components/solid/CartBadge.tsx
// Reactive cart badge component that displays item count from cart store

import { createSignal, onMount, onCleanup } from 'solid-js';

/**
 * CartBadge displays the total number of items in the shopping cart.
 * It reads from localStorage and updates reactively on cart changes.
 */
export function CartBadge(): JSX.Element {
  const [count, setCount] = createSignal(0);

  function updateCount(): void {
    try {
      const stored = localStorage.getItem('mc-enchant:cart');
      if (stored) {
        const cart = JSON.parse(stored);
        const items = cart.items || [];
        const total = items.reduce(
          (sum: number, item: { quantity: number }) => sum + (item.quantity || 0),
          0
        );
        setCount(total);
      } else {
        setCount(0);
      }
    } catch {
      setCount(0);
    }
  }

  onMount(() => {
    // Initial load
    updateCount();

    // Listen for storage changes (from other tabs)
    const handleStorage = (e: StorageEvent): void => {
      if (e.key === 'mc-enchant:cart') {
        updateCount();
      }
    };

    // Listen for same-tab updates
    const handleCartUpdated = (): void => {
      updateCount();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('cart-updated', handleCartUpdated);

    onCleanup(() => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('cart-updated', handleCartUpdated);
    });
  });

  return (
    <span
      class="cart-badge-solid"
      style={{
        display: count() > 0 ? 'inline-flex' : 'none',
      }}
    >
      {count() > 99 ? '99+' : count()}
    </span>
  );
}

export default CartBadge;
