# Task 013: Shopping Cart Store

## Status
DONE

## Description
Implement the shopping cart store using Solid.js signals for reactive state management. The cart tracks recipes the user wants to craft, with quantities and level costs. State is persisted to localStorage.

## Dependencies
- Task 003 (Core types - CartItem interface)

## Acceptance Criteria
- [x] `src/stores/cart.ts` created
- [x] Cart store with Solid.js signals:
  - `items` - reactive signal of CartItem[]
  - `add(recipe)` - add recipe to cart (increment if exists)
  - `addBundle(recipes)` - add multiple recipes at once
  - `remove(recipeId)` - remove recipe from cart
  - `updateQuantity(recipeId, quantity)` - set quantity (remove if 0)
  - `clear()` - empty the cart
- [x] Derived signals:
  - `totalLevels()` - sum of (levelCost × quantity)
  - `totalItems()` - sum of quantities
  - `isEmpty()` - cart has no items
- [x] localStorage persistence:
  - Key: `mc-enchant:cart`
  - Auto-save on changes
  - Auto-load on initialization
  - Handle corrupted/invalid data gracefully
- [x] Unit tests with 80%+ coverage (achieved: 100% statements, 93.33% branches)
- [x] Works in SSR context (no window access during SSR)

## Files to Create/Modify
- `src/stores/cart.ts`
- `tests/unit/stores/cart.test.ts`

## Reference
- `specification.md`: State Management section, CartItem interface
- Solid.js signals documentation

## Store Interface
```typescript
// Types (from src/types/index.ts)
interface CartItem {
  recipeId: string;
  recipeName: string;
  quantity: number;
  levelCost: number;
}

// Store API
const cartStore = {
  // State
  items: Accessor<CartItem[]>,

  // Actions
  add(recipe: { id: string; name: string; totalLevels: number }): void,
  addBundle(recipes: Array<{ id: string; name: string; totalLevels: number }>): void,
  remove(recipeId: string): void,
  updateQuantity(recipeId: string, quantity: number): void,
  clear(): void,

  // Derived
  totalLevels: Accessor<number>,
  totalItems: Accessor<number>,
  isEmpty: Accessor<boolean>,
};
```

## localStorage Format
```json
{
  "items": [
    {
      "recipeId": "swords/god-sword",
      "recipeName": "God Sword",
      "quantity": 2,
      "levelCost": 45
    }
  ]
}
```

## Test Cases
- Add item to empty cart
- Add same item twice (quantity increments)
- Add bundle (multiple items)
- Remove item
- Update quantity
- Update quantity to 0 (removes item)
- Clear cart
- totalLevels calculated correctly
- totalItems calculated correctly
- isEmpty reflects cart state
- Persistence: save to localStorage
- Persistence: load from localStorage
- Persistence: handle invalid data
- SSR safety: no errors during server render

## Notes
- Use `createSignal` for items array
- Use `createMemo` for derived values
- Wrap localStorage access in try/catch for SSR safety
- Consider using `createEffect` for auto-persistence
- Export both store object and individual functions for flexibility
