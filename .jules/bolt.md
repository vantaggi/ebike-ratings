# Bolt's Journal ⚡

This journal tracks critical performance learnings.

## 2024-05-22 - [Example Entry]
**Learning:** [This is a placeholder]
**Action:** [Placeholder]

## 2024-05-24 - Batch DOM updates to prevent layout thrashing
**Learning:** Iterative updates to `innerHTML` or multiple `appendChild` calls within loops can trigger repeated layout recalculations (layout thrashing).
**Action:** Refactored `renderComparisonTable`, `renderComponentDetail`, and `renderEBikeDetail` in `public/script.js` to accumulate HTML into strings before a single `innerHTML` assignment. Used `DocumentFragment` in `populateColumnToggle`, motor brand filter population, and administrative functions in `admin/admin-script.js` to batch element appends.
