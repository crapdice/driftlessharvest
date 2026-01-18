# Blueprint: Marketing Dashboard Overhaul - "The Emerald Orchard"

This plan covers the implementation of the "Emerald Orchard" aesthetic for the `/marketing` dashboard, focusing on premium typography, organic visualizations, and robust wiring.

## Architectural Hypothesis [ARCHITECTURAL_HYPOTHESIS]
By moving the analytical logic (Velocity, Milestones, Source Breakdown) into a more modular structure within `marketing.js` and using CSS variables for theme density, we can achieve high-end visual fidelity without bloating the client-side state.

## Proposed Changes

### [MODIFY] [index.html](file:///c:/Users/zackf/Documents/OpenAI/harvest-app/public/marketing/index.html)
- **Typography Integration**: Add Google Font import for `Libre Baskerville`.
- **Layout Overhaul**: 
    - Implement the "Layered Glass" effect for the Traffic Control panel.
    - Standardize bento card spacing and shadow tokens.
    - Update headers to use the serif typeface for a premium "Agricultural Journal" feel.
- **Organic Charts**: Prepare SVG containers for Bezier-based sparklines.

### [MODIFY] [marketing.js](file:///c:/Users/zackf/Documents/OpenAI/harvest-app/public/marketing/js/marketing.js)
- **Standardize Data Flow**: Ensure all `Promise.all` results are handled with robust error boundaries.
- **Bezier Engine**: Implement a helper function to generate smooth Bezier curves for the velocity chart instead of jagged polyline points.
- **Theme Wiring**: Ensure the dashboard respects the primary `harvest.db` configuration for `activeLaunchVariant`.

## Internal Reflection [CRITIC]
1. **Performance**: Heavy use of `backdrop-filter` (glassmorphism) on many cards can impact rendering performance on lower-end devices. I will monitor repaints.
2. **Race Conditions**: `refreshData` could be triggered multiple times if a user spams the refresh button before the previous fetch completes. I will implement a `isRefreshing` lock.
3. **Accessibility**: High-contrast dark mode needs to maintain WCAG-compliant contrast ratios for text. I will verify the emerald green against the charcoal background.

## Verification Plan (TDD) [VERIFICATION]

### Automated Contract Tests
I will create `tests/routes/marketing.contract.js` to verify:
- `GET /api/admin/marketing/signups` returns 200 and a valid array.
- `GET /api/admin/marketing/stats` correctly aggregates variants.
- `DELETE /api/admin/marketing/signups/:id` functions correctly.

### Visual & Logic Verification
1. **Path Continuity**: Verify that clicking "Update Production" correctly updates `harvest.db` via the API.
2. **Dynamic Rendering**: Verify that the "Seasonal Bloom" variant dynamically changes its label/color based on the system date.
3. **Bezier Smoothness**: Inspect the SVG output of the velocity chart to ensure curves are smooth (T, S path commands).

---

> [!IMPORTANT]
> This blueprint focuses on the UI/UX layer. The underlying API was verified in the previous deep dive and is considered stable.
