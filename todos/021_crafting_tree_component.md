# Task 021: Crafting Tree Component

## Status
DONE

## Description
Implement the interactive Crafting Tree visualization component that displays the optimal anvil combination order as a visual tree. This is the core visualization used in the Quick Craft modal's "Craft Order" tab.

## Dependencies
- Task 009 (Optimizer - CraftingTreeNode structure)
- Task 014 (Craft Progress store)
- Task 015 (Layout & Theme)

## Acceptance Criteria
- [x] `src/components/solid/CraftingTree.tsx` component
- [x] Renders CraftingTreeNode as visual tree:
  - [x] Leaf nodes: base materials (books, base item)
  - [x] Combine nodes: anvil operations with cost
- [x] Top-down flow: materials at top, final item at bottom
- [x] Visual connectors (lines/arrows) between nodes
- [x] Each node displays:
  - [x] Item name or label (e.g., "Book A", "Sharpness V Book")
  - [x] Enchantments list (for intermediate/final items)
  - [x] Level cost (for combine operations)
- [x] Interactive checkboxes for combine steps
- [x] Checkboxes sync with craft-progress store
- [x] Visual indication of completed steps (strikethrough/dimmed)
- [x] Responsive: adapts to container width
- [x] Accessible: keyboard navigation through checkboxes

## Files to Create/Modify
- `src/components/solid/CraftingTree.tsx`
- `src/components/solid/TreeNode.tsx`
- `src/styles/tree.css`

## Reference
- `specification.md`: Combination Tree concept, Modal: Quick Craft
- `src/types/index.ts`: CraftingTreeNode interface

## Tree Node Types
```typescript
interface CraftingTreeNode {
  id: string;
  type: 'leaf' | 'combine';
  item?: string;           // Leaf: "Smite V Book" or "Netherite Sword"
  left?: CraftingTreeNode;
  right?: CraftingTreeNode;
  levelCost?: number;
  xpCost?: number;
  resultingPWP?: number;
  resultLabel?: string;    // "Book A", "Book B", etc.
  enchantments?: string[]; // Display: ["Smite V", "Mending"]
}
```

## Visual Structure
```
         ┌───────────┐
         │ Smite V   │
         │   Book    │ ◄── Leaf node
         └─────┬─────┘
               │
         ┌─────┴─────┐
         │           │
   ┌─────┴─────┐ ┌───┴───┐
   │ Looting   │ │Fire   │
   │ III Book  │ │Aspect │ ◄── More leaf nodes
   └─────┬─────┘ └───┬───┘
         │           │
         └─────┬─────┘
               │
         ┌─────┴─────┐
         │ [✓] 4 lvl │ ◄── Combine node with checkbox
         │  Book A   │
         └─────┬─────┘
               │
   ┌───────────┴───────────┐
   │                       │
   ▼                       ▼
┌──────┐            ┌────────────┐
│Book A│            │ Netherite  │
│      │            │   Sword    │ ◄── Base item leaf
└──┬───┘            └──────┬─────┘
   │                       │
   └───────────┬───────────┘
               │
         ┌─────┴─────┐
         │ [✓] 12 lvl│ ◄── Final combine
         │ God Sword │
         └───────────┘
```

## Notes
- Tree rendering can use CSS Grid or Flexbox
- Consider SVG for connector lines
- Simpler vertical list is acceptable for MVP
- Node IDs enable progress tracking per step
- PWP values help debug but may not need display
