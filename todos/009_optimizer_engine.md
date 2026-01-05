# Task 009: Optimizer Engine

## Status
DONE

## Description
Implement the core optimization algorithm that computes the minimum-cost binary tree for combining enchanted books with a base item. This is the heart of the application.

## Dependencies
- Task 004 (XP calculator)
- Task 005 (Rules engine)
- Task 007 (Enchantment lookup)
- Task 008 (Base items)

## Acceptance Criteria
- [x] `src/engine/optimizer.ts` created
- [x] `computeOptimalTree(enchantments, baseItem): CraftingTreeNode`
- [x] `calculateCombineCost(target, sacrifice): number`
- [x] Algorithm produces valid trees:
  - Single enchantment → single combine step
  - Multiple enchantments → binary tree structure
  - Empty enchantments → just base item (leaf node)
- [x] All steps stay under 39-level survival cap
- [x] PWP (prior work penalty) calculated correctly: `2^n - 1`
- [x] Enchantment costs use correct multipliers (book vs item)
- [x] Deterministic output for same input
- [x] Unit tests with 90%+ coverage (89.47% branches, 99.28% statements)
- [x] Performance test: God sword (7 enchants) < 100ms (20ms actual)

## Files to Create/Modify
- `src/engine/optimizer.ts`
- `tests/unit/engine/optimizer.test.ts`

## Reference
- `specification.md`: Engine: Optimization Algorithm section
- `docs/REFERENCES.md`: PWP formula, Anvil cost calculation
- https://github.com/iamcal/enchant-order - Reference implementation

## Algorithm Overview
```
Total Cost = Target PWP + Sacrifice PWP + Enchantment Cost

Enchantment Cost = Σ (level × multiplier)
  - bookMultiplier when sacrifice is a book
  - itemMultiplier when sacrifice is an item

PWP = 2^n - 1 where n = prior anvil operations
```

## Test Cases (from spec)
- Single enchantment → single leaf node
- God sword (7 enchants) → stays under 39-level cap per step
- Empty enchantment list → just base item
- Deterministic results for same input

## Notes
- The optimizer should minimize TOTAL level cost, not per-step cost
- Order matters significantly due to PWP accumulation
- May need greedy or dynamic programming approach
- Reference iamcal's implementation for algorithm guidance
