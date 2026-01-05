# Task 029: Mobile Crafting Tree View

## Status
DONE

## Description
Improve the mobile view of the Quick Craft modal and crafting tree visualization. Current issues:

1. **Modal positioning**: On mobile, the modal has `align-items: flex-end` which pushes tall content off-screen. Large trees force a top margin that makes the modal unusable.

2. **Tree layout**: The nested flexbox layout spreads nodes horizontally, causing them to get cut off on narrow screens. Nodes on the right side are clipped and inaccessible.

## Dependencies
- Task 028 (Nested HTML Tree Layout)

## Acceptance Criteria
- [x] Modal fills available viewport space on mobile (no forced top margin)
- [x] Modal body takes full available height, not constrained to 55vh
- [x] Crafting tree container allows horizontal scrolling on mobile
- [x] All tree nodes are accessible via scroll on mobile viewports
- [x] Visual appearance remains clean and usable
- [x] Desktop behavior unchanged

## Files to Modify
- `src/styles/modal.css` - Fix mobile modal positioning/sizing
- `src/styles/tree.css` - Allow horizontal scroll on mobile

## Reference
- User feedback with screenshot showing:
  - Modal pushed off-screen on mobile
  - Tree nodes cut off on right side

## Notes
Key changes implemented:
1. Modal: Changed `align-items: flex-end` to `stretch` for full viewport
2. Modal: Full viewport height on mobile, removed 55vh constraint
3. Tree container: `-webkit-overflow-scrolling: touch` for momentum scrolling
4. Tree container: `touch-action: pan-x pan-y` for gesture handling
5. Tree container: `overscroll-behavior: contain` to prevent scroll chaining
6. Checkboxes: 24px size on mobile (up from 16px) with 44px tap area
7. Tap feedback: `transform: scale(0.97)` on `:active` state for visual response
