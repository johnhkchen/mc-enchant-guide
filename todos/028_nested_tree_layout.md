# Task 028: Nested HTML Tree Layout

## Status
DONE

## Description

Refactor the crafting tree to use **nested HTML structure** instead of level-based flat rendering. The current approach groups nodes by depth, which breaks visual hierarchy when subtrees have different depths. The nested approach keeps each subtree's nodes grouped together, matching how users mentally parse the combine order.

### Current Problems (from screenshot analysis)

1. **Disconnected subtrees**: Nodes like "Depth Strider III Book" appear far from their combine parent because they're grouped with other same-depth nodes from different subtrees
2. **Floating base items**: The base item (e.g., "Netherite Boots") floats alone, disconnected from context
3. **Long crossing connectors**: SVG lines span large distances because related nodes are spread horizontally
4. **Broken visual hierarchy**: Hard to trace which items combine into what

### Solution: Nested HTML + CSS Pseudo-Element Connectors

The tree's logical structure maps directly to nested HTML:

```html
<!-- Final combine at bottom, children nested inside -->
<div class="tree-node tree-node--combine tree-node--root">
  <div class="tree-children">
    <div class="tree-node tree-node--leaf">Netherite Boots</div>
    <div class="tree-node tree-node--combine">
      <div class="tree-children">
        <div class="tree-node tree-node--combine">...</div>
        <div class="tree-node tree-node--combine">...</div>
      </div>
      <div class="tree-node-content">13 lvl - Enchanted Book</div>
    </div>
  </div>
  <div class="tree-node-content">38 lvl - Netherite Boots</div>
</div>
```

**Key insight**: Children come BEFORE parent content in DOM order, allowing natural top-to-bottom CSS flow (materials at top → final item at bottom).

## Dependencies

- Task 027 (provides current tree-layout.ts structure to refactor)

## Acceptance Criteria

- [ ] Tree renders with nested HTML structure (`<div>` with `.tree-children` containing child nodes)
- [ ] Each subtree's nodes stay visually grouped together
- [ ] Connectors drawn with CSS pseudo-elements (no SVG calculation needed)
- [ ] Connector lines:
  - [ ] Vertical line from parent up to horizontal bar
  - [ ] Horizontal bar spans width of children
  - [ ] Vertical lines from bar down to each child
- [ ] First/last/only-child selectors handle connector edge cases
- [ ] Layout responds naturally to container resize (no JS recalculation)
- [ ] Tree scales with container using CSS (em units or CSS custom properties)
- [ ] Existing functionality preserved:
  - [ ] Checkboxes toggle completion state
  - [ ] Progress tracking works
  - [ ] Completed nodes show visual state
- [ ] All existing tests pass or are updated for new structure
- [ ] Visual hierarchy clear: easy to trace combine order from leaves to root

## Files to Create/Modify

### Modify
- `src/components/solid/CraftingTree.tsx` - Render nested structure recursively
- `src/components/solid/TreeNode.tsx` - Handle both leaf and combine nodes with children
- `src/components/solid/tree-layout.ts` - May simplify or remove (DOM structure IS the layout)
- `src/styles/tree.css` - Complete rewrite for nested flexbox + pseudo-element connectors

### Possibly Remove
- SVG connector calculation code in CraftingTree.tsx (replaced by CSS)

## Technical Approach

### 1. HTML Structure Pattern

Based on research from Treeflex, iamkate, and Fractaled Mind tutorials:

```html
<div class="tree-node tree-node--combine">
  <!-- Children container: rendered ABOVE parent content -->
  <div class="tree-children">
    <div class="tree-node tree-node--leaf">
      <div class="tree-node-content">Child 1</div>
    </div>
    <div class="tree-node tree-node--leaf">
      <div class="tree-node-content">Child 2</div>
    </div>
  </div>

  <!-- Parent content: rendered BELOW children -->
  <div class="tree-node-content">
    <label class="tree-node-header">...</label>
    <span class="tree-node-result">Parent Result</span>
  </div>
</div>
```

### 2. CSS Layout Strategy

```css
.tree-node--combine {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tree-children {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: var(--tree-horizontal-gap);
  position: relative; /* For connector pseudo-elements */
}
```

### 3. CSS Connector Lines

Three connector segments for each combine:

```css
/* 1. Horizontal bar above children */
.tree-children::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: var(--first-child-center);
  right: var(--last-child-center);
  height: 0;
  border-top: 2px solid var(--connector-color);
}

/* 2. Vertical lines from bar to each child */
.tree-children > .tree-node::before {
  content: '';
  position: absolute;
  top: calc(-1 * var(--connector-height));
  left: 50%;
  height: var(--connector-height);
  border-left: 2px solid var(--connector-color);
}

/* 3. Vertical line from parent to bar */
.tree-node--combine > .tree-node-content::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  height: var(--connector-height);
  border-left: 2px solid var(--connector-color);
}
```

### 4. Edge Cases with Selectors

```css
/* Only child: no horizontal bar needed */
.tree-children > .tree-node:only-child::before {
  /* Just vertical line, no horizontal extension */
}

/* First child: horizontal extends right only */
.tree-children > .tree-node:first-child:not(:only-child)::after {
  left: 50%;
  right: 0;
}

/* Last child: horizontal extends left only */
.tree-children > .tree-node:last-child:not(:only-child)::after {
  left: 0;
  right: 50%;
}
```

### 5. Recursive Rendering (Solid.js)

```tsx
function TreeNode(props: { node: CraftingTreeNode }): JSX.Element {
  const { node } = props;

  if (node.type === 'leaf') {
    return (
      <div class="tree-node tree-node--leaf">
        <div class="tree-node-content">...</div>
      </div>
    );
  }

  // Combine node: children first, then content
  return (
    <div class="tree-node tree-node--combine">
      <div class="tree-children">
        <TreeNode node={node.left} />
        <TreeNode node={node.right} />
      </div>
      <div class="tree-node-content">...</div>
    </div>
  );
}
```

## Reference

- [Treeflex Library](https://dumptyd.github.io/treeflex/) - Nested list approach with em-based scaling
- [Tree Views in CSS](https://iamkate.com/code/tree-views/) - Pseudo-element connector technique
- [Building Pure CSS Trees](https://fractaledmind.com/2018/03/05/css-tree/) - Flexbox + first/last-child logic
- [CSS3 Family Tree](https://thecodeplayer.com/walkthrough/css3-family-tree) - Connector line patterns

## Notes

### Why Nested > Level-Based

| Aspect | Level-Based (current) | Nested (proposed) |
|--------|----------------------|-------------------|
| DOM structure | Flat rows by depth | Mirrors tree hierarchy |
| Subtree grouping | Lost | Preserved |
| Connector calculation | JS post-render SVG | CSS pseudo-elements |
| Resize handling | JS recalculation | Native CSS reflow |
| Semantic meaning | None | Parent-child explicit |

### Potential Challenges

1. **Deep trees may overflow horizontally** - May need horizontal scroll or scaling
2. **Unbalanced trees** - Left-heavy or right-heavy trees may look lopsided
3. **Connector positioning** - CSS calc() for dynamic centering over variable-width children

### Performance Considerations

- No JS layout calculations
- No ResizeObserver needed
- CSS handles all reflow
- Fewer DOM mutations (no SVG path updates)
