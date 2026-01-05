# Task 024: Tree Auto-Scaling

## Status
DONE

## Description
The crafting tree visualization doesn't fit properly within the modal. Nodes get squished, text is cut off, and the layout is unbalanced when there are many enchantments.

Current problems:
- Leaf nodes (books) get compressed and text overflows
- Tree is visually unbalanced (left side sparse, right side crowded)
- Connector lines become messy
- Nodes overlap when tree is wide

## Dependencies
- Task 022 (Improved Craft Modal)

## Acceptance Criteria
- [ ] Tree always fits within the modal viewport without overflow
- [ ] All node text is readable (no truncation or overflow)
- [ ] Tree scales down proportionally for complex recipes (7+ enchants)
- [ ] Tree uses full available space for simple recipes (1-3 enchants)
- [ ] Connector lines remain clean and visually clear
- [ ] Works across all existing recipes (god sword, protection boots, etc.)

## Technical Approach

### Option A: CSS Transform Scale (Recommended)
Use `transform: scale()` to shrink the entire tree to fit:

```typescript
// Calculate scale factor based on tree dimensions vs container
const treeWidth = treeRef.scrollWidth;
const containerWidth = containerRef.clientWidth;
const scale = Math.min(1, containerWidth / treeWidth);

// Apply transform
style={`transform: scale(${scale}); transform-origin: top center;`}
```

Pros:
- Preserves proportions perfectly
- Simple implementation
- No layout recalculation needed

Cons:
- Text may become small on very complex trees

### Option B: Dynamic Node Sizing
Calculate node sizes based on available space and tree complexity:

```typescript
const nodeCount = countLeafNodes(tree);
const baseSize = Math.max(60, 140 - (nodeCount * 10));
```

### Option C: Horizontal Scroll with Pan
Keep nodes at fixed size, allow horizontal scrolling with touch/drag pan.

## Files to Modify
- `src/components/solid/CraftingTree.tsx` - Add scaling logic
- `src/styles/tree.css` - Revert flex constraints, use fixed sizes with scale

## Reference
- Current tree renders fine for 1-3 enchants, breaks at 4+
- God sword (6 enchants) is a good test case
- Protection boots (4 enchants) shows asymmetric layout issues

## Notes
- Consider adding a zoom control (+/-) for user adjustment
- May need to measure tree after render to calculate scale
- Use ResizeObserver to recalculate on modal resize
