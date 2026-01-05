# Task 015: Layout & Minecraft Theme CSS

## Status
DONE

## Description
Create the base Layout component and Minecraft-themed CSS foundation. This establishes the visual design system that all other components will build upon.

## Dependencies
- Task 001 (Project scaffolding)

## Acceptance Criteria
- [x] `src/components/astro/Layout.astro` created
  - HTML boilerplate with proper meta tags
  - Slot for page content
  - Global CSS imports
  - Header with site title and Shopping List link placeholder
- [x] `src/styles/minecraft.css` created
  - CSS custom properties (variables) for colors, spacing, typography
  - Minecraft color palette (gray panels, gold accents, enchantment purple)
  - Base element resets
  - Utility classes for common patterns
- [x] `src/styles/components.css` created
  - Button styles (primary, secondary, icon-only)
  - Card base styles
  - Chip/tag styles (for enchantments, recipe tags)
  - Form input styles (search, select)
- [x] CSS variables documented in code comments
- [x] Responsive foundation (desktop-first, supports "half-screen" ~640px+)
- [x] Smoke test: Layout renders without errors

## Files to Create/Modify
- `src/components/astro/Layout.astro`
- `src/styles/minecraft.css`
- `src/styles/components.css`
- `src/pages/index.astro` (update to use Layout)

## Reference
- `specification.md`: UI/UX Specification > Visual Design
- Minecraft wiki for authentic color values

## Color Palette (from Minecraft UI)
```css
/* Suggested starting point - verify against wiki */
--mc-black: #000000;
--mc-dark-gray: #3f3f3f;
--mc-gray: #8b8b8b;
--mc-light-gray: #c6c6c6;
--mc-white: #ffffff;

--mc-gold: #ffaa00;
--mc-aqua: #55ffff;
--mc-purple: #aa00aa;       /* Enchantment glow */
--mc-light-purple: #ff55ff;
--mc-green: #55ff55;
--mc-dark-green: #00aa00;
--mc-red: #ff5555;
--mc-dark-red: #aa0000;

/* UI-specific */
--mc-panel-bg: #8b8b8b;
--mc-panel-border-light: #ffffff;
--mc-panel-border-dark: #373737;
--mc-slot-bg: #8b8b8b;
```

## Typography
- Headers: Minecraft font (or fallback pixel font)
- Body: System sans-serif stack for readability
- Monospace: For level costs, XP values

## Button Styles
```
[Primary]     - Gold background, dark text, for main actions
[Secondary]   - Gray background, light border, for secondary actions
[Icon-only]   - Square, for +/- quantity controls
[Danger]      - Red tint, for clear/remove actions
```

## Notes
- Keep CSS lightweight - no framework
- Use CSS nesting (supported in modern browsers)
- Consider CSS layers for organization
- Font files go in `public/assets/fonts/` (if custom fonts added)
- Test in Chrome, Firefox, Safari
