# Task 022: Improved Craft Modal

## Status
DONE

## Description
The Quick Craft modal is too small, causing the crafting tree to get clipped and be hard to use. The tree connector lines (CSS pseudo-elements) appear crooked or cut off, and the layout doesn't adapt well to different tree sizes.

This task improves the modal by:
1. Making it resizable (drag corners/edges)
2. Making it draggable (drag title bar)
3. Expanding default size to better accommodate trees
4. Improving the tree connector line rendering

## Dependencies
- Task 019 (Quick Craft modal)
- Task 021 (Crafting Tree component)

## Acceptance Criteria
- [ ] Modal is draggable by the header/title bar
- [ ] Modal is resizable by dragging edges/corners
- [ ] Resize handles visible on hover
- [ ] Modal starts at a larger default size (e.g., 800px wide, 600px tall)
- [ ] Modal respects min-width/min-height constraints
- [ ] Modal respects viewport boundaries (can't drag off-screen)
- [ ] Position/size persists during session (optional: localStorage)
- [ ] Tree connector lines render cleanly at all sizes
- [ ] Tree content scrolls properly when exceeding modal bounds
- [ ] Works on mobile (resize disabled, full-width modal)
- [ ] Keyboard accessibility preserved (Escape to close, focus trap)

## Files to Modify
- `src/components/solid/QuickCraftModal.tsx` - Add drag/resize logic
- `src/styles/modal.css` - Update modal sizing, add resize handles
- `src/styles/tree.css` - Fix connector line rendering

## Technical Approach

### Drag Implementation
```typescript
// Track position with signals
const [position, setPosition] = createSignal({ x: 0, y: 0 });
const [isDragging, setIsDragging] = createSignal(false);

// Mouse down on header starts drag
// Mouse move updates position
// Mouse up ends drag
// Use transform: translate() for smooth positioning
```

### Resize Implementation
```typescript
// Track size with signals
const [size, setSize] = createSignal({ width: 800, height: 600 });
const [isResizing, setIsResizing] = createSignal(false);

// Resize handles on edges and corners
// Mouse down on handle starts resize
// Mouse move updates size
// Constrain to min/max bounds
```

### CSS Changes
```css
.modal {
  position: fixed;
  /* Remove centering - use transform for position */
  max-width: none;
  max-height: none;
  resize: none; /* Custom resize, not browser native */
}

.modal-resize-handle {
  position: absolute;
  /* Different handles for edges and corners */
}
```

### Tree Connector Fixes
- Use SVG lines instead of CSS pseudo-elements for cleaner rendering
- Or fix existing pseudo-element positioning for various tree depths
- Ensure lines don't get clipped by overflow containers

## Reference
- `src/styles/modal.css`: Current modal styles (max-width: 600px)
- `src/styles/tree.css`: Tree connector lines (::before, ::after pseudo-elements)
- Common drag/resize patterns in vanilla JS (no library needed)

## Notes
- Consider using `pointer-events` for resize handles
- Use `will-change: transform` for smooth dragging
- May need to adjust z-index during drag/resize
- Test with various tree sizes (1-7 enchantments)
- Reset position when closing modal (or remember last position)
