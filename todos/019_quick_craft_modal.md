# Task 019: Quick Craft Modal

## Status
DONE

## Description
Implement the Quick Craft modal that opens when clicking "Quick Craft" on a recipe card. This modal shows two tabs: Craft Order (tree visualization) and Pick List (BOM checklist). Users can track their crafting progress with checkboxes.

## Dependencies
- Task 016 (Recipe Card - dispatches quick-craft event)
- Task 009 (Optimizer - provides tree structure)
- Task 010 (BOM generator)
- Task 014 (Craft Progress store)
- Task 015 (Layout & Theme)

## Acceptance Criteria
- [x] Modal component with overlay and close button
- [x] Opens on `quick-craft` custom event from RecipeCard
- [x] Two-tab interface: "Craft Order" and "Pick List"
- [x] Craft Order tab:
  - [x] Top-down tree visualization (materials at top, final item at bottom)
  - [x] Visual connectors showing which items combine
  - [x] Each combine step shows: checkbox, level cost, intermediate label
  - [x] Checkboxes persist via craft-progress store
- [x] Pick List tab:
  - [x] Materials checklist from BOM (base item + enchanted books)
  - [x] Checkboxes for gathering progress
  - [x] [Copy to Clipboard] button
- [x] Modal closes on Escape key or clicking backdrop
- [x] Accessible: focus trap, ARIA attributes, keyboard navigation
- [x] Responsive: works on mobile screens

## Files to Create/Modify
- `src/components/solid/QuickCraftModal.tsx`
- `src/components/solid/CraftOrderTab.tsx`
- `src/components/solid/PickListTab.tsx`
- `src/styles/modal.css` (or inline styles)

## Reference
- `specification.md`: Modal: Quick Craft section
- `src/engine/bom.ts`: BOM generation
- `src/stores/craft-progress.ts`: Progress tracking

## Modal Structure
```
┌─────────────────────────────────────────────────┐
│  God Sword                              [✕]    │
├─────────────────────────────────────────────────┤
│  [Craft Order] [Pick List]                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────┐   ┌─────────┐                     │
│  │Smite V  │   │Looting  │                     │
│  │Book     │   │III Book │                     │
│  └────┬────┘   └────┬────┘                     │
│       └──────┬──────┘                          │
│              ▼                                  │
│  [✓] Combine → Book A (4 levels)               │
│              │                                  │
│  ┌───────────┴───────────┐                     │
│  │                       │                     │
│  ▼                       ▼                     │
│  Book A         Netherite Sword                │
│              │                                  │
│  [✓] Combine → God Sword (12 levels)           │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Notes
- Tree visualization can be simplified (vertical list) for MVP
- Consider lazy loading recipe data when modal opens
- Progress persists across sessions via localStorage
