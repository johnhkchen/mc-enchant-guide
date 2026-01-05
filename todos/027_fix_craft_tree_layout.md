# Task 027: Fix Craft Order Tree Layout

## Status
DONE

## Description
The crafting tree visualization has serious layout issues. Nodes are scattered without clear visual hierarchy, making it hard to follow the combine order. The tree should display as a clean binary tree with materials at the top and final result at the bottom.

## Current Issues (from screenshot)
1. **Nodes not aligned** - Intermediate combine steps are scattered randomly instead of centered under their children
2. **No clear level separation** - Tree levels (leaf → combine → combine → final) aren't visually distinct
3. **Connector lines ineffective** - Hard to trace which items combine with which
4. **Horizontal spacing broken** - Nodes overlap or have inconsistent gaps
5. **Tree doesn't read top-to-bottom** - Should be: materials at top → combines in middle → final item at bottom

## Expected Behavior
```
Level 0 (top):    [Book1] [Book2] [Book3] [Book4] [Book5] [Book6] [Item]
                     \     /         \     /         \     /
Level 1:           [Combine]       [Combine]       [Combine]
                        \             /                 |
Level 2:                [Combine]                      [Combine]
                              \                        /
Level 3 (bottom):              [Final Item]
```

## Acceptance Criteria
- [ ] Leaf nodes (materials) aligned horizontally at top
- [ ] Each tree level has consistent vertical spacing
- [ ] Parent nodes centered horizontally under their children
- [ ] Connector lines clearly show parent-child relationships
- [ ] Tree scales properly for different numbers of enchantments (2-7)
- [ ] Final item prominently displayed at bottom
- [ ] Works at different container sizes (modal resize)

## Files to Investigate/Modify
- `src/components/solid/CraftingTree.tsx` - Main tree component
- `src/components/solid/TreeNode.tsx` - Individual node rendering
- `src/styles/tree.css` - Tree layout styles
- `src/engine/optimizer.ts` - Tree data structure (verify structure is correct)

## Reference
- Task 021: Original Crafting Tree implementation
- Task 024: Tree Auto-Scaling
- Task 025: Tree Connector Lines (SVG-based)

## Notes
- The optimizer produces a correct binary tree structure, so this is a rendering/CSS issue
- Current implementation uses CSS flexbox - may need grid or absolute positioning
- SVG connectors were added in Task 025 but may need coordinate recalculation
- Consider using a proper tree layout algorithm (e.g., Reingold-Tilford)
