# Task 030: Inline Leaf Nodes for Compact Tree Layout

## Status
PENDING

## Description
Reduce dead space in the crafting tree by rendering isolated leaf nodes (like base items) inline with their parent combine operation rather than as distant siblings in the tree structure.

**Current problem**: When a combine operation has one simple leaf child (e.g., Netherite Boots) and one complex subtree child (e.g., a chain of enchanted book combines), the leaf gets positioned at the far corner of the tree, creating significant dead space.

**Proposed solution**: Detect when a combine has a leaf sibling paired with a complex subtree, and render the leaf visually adjacent to (or inline with) the parent combine node instead of in the standard horizontal sibling layout.

### Visual Example

**Current layout** (lots of dead space):
```
[Complex Subtree of Books]
            |
      [13 lvl Combine]
           /
          /
[Base Item]--------------------[Final Combine]
(far corner)                   (center bottom)
```

**Proposed layout** (compact):
```
[Complex Subtree of Books]
            |
      [13 lvl Combine]    [Base Item]
             \              /
              \            /
              [Final Combine]
```

Or even more compact - base item rendered as a "side input" to the combine:
```
[Complex Subtree]
       |
[Base Item] + [Combine] → [Final Result]
```

## Dependencies
- Task 029 (Mobile Crafting Tree View)

## Acceptance Criteria
- [ ] Identify combine nodes where one child is a simple leaf and one is complex
- [ ] Render the leaf node visually closer to its parent combine (not at tree edge)
- [ ] Maintain correct connector lines between nodes
- [ ] Preserve semantic meaning (user still understands what combines with what)
- [ ] Works on both mobile and desktop
- [ ] Tree remains readable and interactive (checkboxes still work)
- [ ] Dynamic scaling still functions correctly

## Files to Modify
- `src/components/solid/TreeNode.tsx` - Detect and render inline leaves differently
- `src/styles/tree.css` - CSS for inline leaf positioning
- Possibly `src/components/solid/CraftingTree.tsx` - May need layout adjustments

## Technical Approach Options

### Option A: Render leaf adjacent to parent content
Instead of placing the leaf in `.tree-children`, render it as part of the parent's `.tree-node-content` area with a small connector.

### Option B: Absolute positioning
Keep leaf in `.tree-children` but use absolute positioning on mobile to place it near the parent combine.

### Option C: Different flex layout for asymmetric cases
Use `flex-direction: column` or nested flex for asymmetric children, stacking the leaf below/beside its complex sibling.

## Reference
- User screenshot showing Netherite Boots in far corner with large dead space
- Task 029 added layout classes: `tree-children--leaf-left`, `tree-children--leaf-right`

## Notes
- The base item (non-book leaf) is typically the most visually "lost" in the current layout
- This is most impactful on mobile where screen real estate is limited
- Need to be careful not to break connector line logic (pseudo-elements)
- Consider whether this should apply only on mobile or globally
