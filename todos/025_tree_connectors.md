# Task 025: Tree Connector Lines

## Status
DONE

## Description
The CSS pseudo-element approach for drawing tree connector lines is unreliable. Lines are missing, misaligned, or inconsistent across different tree structures. Need a more robust solution.

Current problems:
- Vertical lines from leaf nodes to horizontal bar are missing
- CSS `::after` pseudo-elements don't reliably position across nested tree structures
- Lines get clipped or hidden by parent containers
- Scaling transforms may affect line rendering

## Dependencies
- Task 024 (Tree Auto-Scaling)

## Acceptance Criteria
- [x] All nodes have visible connectors to their children
- [x] Connectors are clean vertical and horizontal lines
- [x] Lines render correctly at all scale factors
- [x] Works for trees of any depth (1-7+ enchantments)
- [x] Lines don't get clipped by overflow containers

## Technical Approach

### Option A: SVG Overlay (Recommended)
Render connectors as an SVG layer that overlays the tree:

```typescript
// Calculate positions of all nodes after render
// Draw SVG paths between parent and child nodes
<svg class="tree-connectors" style="position: absolute; inset: 0; pointer-events: none;">
  <path d="M x1,y1 L x1,y2 L x2,y2 L x2,y3" stroke="gray" fill="none" />
</svg>
```

Pros:
- Precise control over line positions
- Easy to style (stroke width, color, dashes)
- Scales correctly with transform
- Can use curved paths for aesthetics

Cons:
- Requires measuring node positions after render
- Need to recalculate on resize

### Option B: CSS Grid Lines
Use CSS grid with explicit grid lines:

```css
.tree-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, 120px);
}
```

### Option C: Border-based Connectors
Use borders on wrapper elements instead of pseudo-elements:

```tsx
<div class="connector-wrapper" style="border-left: 2px solid gray; border-bottom: 2px solid gray;">
  <TreeNode ... />
</div>
```

## Files to Modify
- `src/components/solid/CraftingTree.tsx` - Add SVG connector layer
- `src/components/solid/TreeNode.tsx` - Add data attributes for node positions
- `src/styles/tree.css` - Remove pseudo-element connectors, add SVG styles

## Reference
- Current connectors use `::before` and `::after` pseudo-elements
- Tree structure is recursive (TreeNode renders children)
- Need to handle both leaf and combine nodes

## Notes
- SVG approach is most reliable but requires position calculation
- Consider using refs to measure node positions
- May need MutationObserver or ResizeObserver to update lines
- Could add animation to lines for visual polish
