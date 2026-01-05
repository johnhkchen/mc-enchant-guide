# Task 023: Enchanted Book Labels for Intermediate Steps

## Status
DONE

## Description
Currently, intermediate combination steps are labeled with abstract shorthand like "Book A", "Book B", "Book C", etc. This is confusing because users don't know which enchantments are on each intermediate book.

This task improves labeling by:
1. Adding "Enchanted Book" as a recognized base item type
2. Showing actual enchantment names on intermediate steps instead of "Book A/B/C"
3. Displaying multiple enchantments as multiple rows when a book has combined enchants

### Current Behavior
```
[Sharpness V Book] + [Looting III Book] = "Book A"
[Fire Aspect II Book] + [Book A] = "Book B"
```

### Desired Behavior
```
[Sharpness V Book] + [Looting III Book] = Enchanted Book
                                           Sharpness V
                                           Looting III

[Fire Aspect II Book] + [Enchanted Book   ] = Enchanted Book
                         Sharpness V            Sharpness V
                         Looting III            Looting III
                                                Fire Aspect II
```

## Dependencies
- Task 009 (Optimizer engine - generates resultLabel)
- Task 021 (Crafting Tree component - displays labels)

## Acceptance Criteria
- [x] Intermediate book results labeled "Enchanted Book" (not "Book A/B/C")
- [x] Each intermediate node shows all enchantments it contains
- [x] Enchantments displayed as individual rows below the item name
- [x] Enchantments use proper display format (e.g., "Sharpness V", not "sharpness:5")
- [x] Final item still shows its actual name (e.g., "Netherite Sword")
- [x] Tree visually distinguishes single-enchant books from multi-enchant books
- [x] Tests updated for new labeling behavior
- [x] BOM generation still works correctly (uses leaf nodes only)

## Files to Modify
- `src/engine/optimizer.ts` - Change `resultLabel` generation logic
- `src/components/solid/TreeNode.tsx` - Display enchantments on all combine nodes (not just root)
- `src/styles/tree.css` - Style multi-enchant display on intermediate nodes
- `tests/unit/engine/optimizer.test.ts` - Update expected labels

## Technical Approach

### Optimizer Changes (`optimizer.ts`)
```typescript
// Current (line ~242):
const resultLabel = isLastStep ? target.displayName : `Book ${String.fromCharCode(65 + labelIndex)}`;

// New:
const resultLabel = isLastStep ? target.displayName : 'Enchanted Book';

// The enchantments array is already populated on combine nodes
// Just need to ensure it's passed through correctly
```

### TreeNode Changes (`TreeNode.tsx`)
```typescript
// Current: Only shows enchantments on root node (isRoot check)
<Show when={node.enchantments && node.enchantments.length > 0 && isRoot}>

// New: Show enchantments on all combine nodes (not just root)
<Show when={node.enchantments && node.enchantments.length > 0}>
```

### CSS Changes (`tree.css`)
```css
/* Intermediate nodes with enchantments */
.tree-combine-enchants {
  /* Already exists, may need adjustment for non-root nodes */
  display: flex;
  flex-direction: column; /* Stack vertically instead of wrap */
  gap: 2px;
}

/* Differentiate intermediate vs final */
.tree-combine-operation:not(.tree-combine-operation--final) .tree-combine-enchants {
  font-size: var(--text-xs);
  opacity: 0.9;
}
```

## Visual Mockup
```
┌─────────────────┐   ┌─────────────────┐
│ Sharpness V     │   │ Looting III     │
│ Book            │   │ Book            │
└────────┬────────┘   └────────┬────────┘
         │                     │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ [x] 4 lvl           │
         │ Enchanted Book      │
         │   Sharpness V       │
         │   Looting III       │
         └──────────┬──────────┘
                    │
    ┌───────────────┴───────────────┐
    │                               │
┌───▼───────────┐         ┌────────▼────────┐
│ Fire Aspect II│         │ Enchanted Book  │
│ Book          │         │   Sharpness V   │
└───────┬───────┘         │   Looting III   │
        │                 └────────┬────────┘
        └───────────┬──────────────┘
                    │
         ┌──────────▼──────────┐
         │ [x] 6 lvl           │
         │ Enchanted Book      │
         │   Sharpness V       │
         │   Looting III       │
         │   Fire Aspect II    │
         └─────────────────────┘
```

## Reference
- `src/engine/optimizer.ts:242` - Current "Book A/B/C" label generation
- `src/types/index.ts` - `CraftingTreeNode.enchantments` field already exists
- `src/utils/format.ts` - `formatEnchantment()` for display formatting

## Notes
- The `enchantments` array on combine nodes already contains the accumulated enchants
- This is primarily a display change, not a logic change
- Consider truncating long enchantment lists (e.g., "...and 3 more")
- May want to add a CSS class for "multi-enchant" books for distinct styling
