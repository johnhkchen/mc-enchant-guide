# Task 020: Shopping List Page

## Status
DONE

## Description
Implement the Shopping List page (`/list`) that displays all items in the cart with quantity controls, level costs, and a combined Bill of Materials aggregated across all cart items.

## Dependencies
- Task 013 (Cart store)
- Task 010 (BOM generator - aggregateBOMs)
- Task 015 (Layout & Theme)
- Task 009 (Optimizer - for recipe trees)

## Acceptance Criteria
- [x] `src/pages/list.astro` page at `/list` route
- [x] Items to Craft section:
  - [x] List of cart items with recipe name and level cost
  - [x] Quantity controls: [−] [quantity] [+] per item
  - [x] [View] button opens Quick Craft modal
  - [x] [Remove] button removes item from cart
  - [x] Grand total levels displayed
- [x] Combined Materials section:
  - [x] Aggregated BOM across all cart items × quantities
  - [x] Groups: Base Items, Enchanted Books
  - [x] Shows quantity needed for each material
- [x] Action buttons:
  - [x] [Clear All] - empties cart with confirmation
  - [x] [Copy List] - copies text summary to clipboard
  - [x] [Export as Text] - downloads .txt file
- [x] Empty state when cart is empty
- [x] Reactive updates when cart changes
- [x] Accessible: proper headings, keyboard navigation

## Files to Create/Modify
- `src/pages/list.astro`
- `src/components/solid/CartItemList.tsx`
- `src/components/solid/CombinedMaterials.tsx`

## Reference
- `specification.md`: Page: Shopping List
- `src/stores/cart.ts`: Cart state
- `src/engine/bom.ts`: aggregateBOMs function

## Page Structure
```
┌─────────────────────────────────────────────────┐
│  Shopping List                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ITEMS TO CRAFT                                │
│  ┌─────────────────────────────────────────┐   │
│  │ God Sword          [−] 2 [+]  90 levels │   │
│  │                        [View] [Remove]  │   │
│  ├─────────────────────────────────────────┤   │
│  │ Fortune Pick       [−] 1 [+]  35 levels │   │
│  │                        [View] [Remove]  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Grand Total: 215 levels                        │
│                                                 │
│  COMBINED MATERIALS                             │
│  ┌─────────────────────────────────────────┐   │
│  │ Base Items                              │   │
│  │   2× Netherite Sword                    │   │
│  │   1× Netherite Pickaxe                  │   │
│  │                                         │   │
│  │ Enchanted Books                         │   │
│  │   2× Sharpness V                        │   │
│  │   2× Smite V                            │   │
│  │   3× Looting III                        │   │
│  │   1× Fortune III                        │   │
│  │   ...                                   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [Clear All] [Copy List] [Export as Text]      │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Notes
- BOM aggregation must handle duplicate enchantments correctly
- Quantity controls should update localStorage immediately
- Consider adding "Add more" link back to catalog
- Copy/Export formats should be human-readable
