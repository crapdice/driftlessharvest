# Development Log & State Snapshots

This document tracks granular changes, debugging steps, and state snapshots to facilitate rollbacks and reference.

## 2026-01-08: Parallax & Theme Revert

### Objective
Revert all parallax effects and restore original "Sketch" theme styling after debugging session.

### Changes
1.  **`js/views/layout.js`**: Removed fixed background layer.
2.  **`index.html`**: Restored `bg-nature-50` to `<body>`.
3.  **`js/views/marketplace.js`**: Restored `bg-nature-50` container.
4.  **`js/views/home.js`**: Restored `bg-nature-50` to `#featured-products-container`.
    *   *Snapshot (Original)*: `<section id="featured-products-container" class="max-w-7xl mx-auto px-6 py-20 bg-nature-50"></section>`
5.  **`js/themes.js`**: Reverted `hero-rustic` to `radial-gradient(...)`.
    *   *Verified Colors*: Paper `#fdfbf7`, Black `#1a1a1a` (Matches Baseline).
6.  **`js/modules/actions.js`**: Removed temporary debug logic for background images and narrative overrides.
7.  **`js/views/auth.js`**: Fixed image paths (absolute `/assets/...`) and removed hover zoom.

### Current State
- App is back to "Solid Paper" aesthetic.
- Global Parallax is inactive.
- Parallax/Zoom effects on Auth page removed.

## 2026-01-08: Box Modal Revert (Correction)

### Objective
Revert failing "Glassmorphism" modal redesign. Return to split-view layout.

### Changes
1.  **`index.html`**: Removed glassmorphism overlay. Restored right-column item list.
2.  **`js/views/marketplace.js`**: Restored original list item rendering (standard padding, no borders).

### Current State
- Modal is back to original Split View (Image Left, Description/List Right).
- All parallax effects remain off.

## 2026-01-08: Box Modal State Snapshot (SAFE POINT)

Use this snapshot to restore the working Split-View layout.

### `index.html` (Modal Structure)
```html
<div id="modal-box-img" class="w-full md:w-1/2 min-h-[300px] bg-cover bg-center relative group">
   <div class="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
</div>

<div class="w-full md:w-1/2 p-10 md:p-12 flex flex-col relative">
   <!-- ... Header & Desc ... -->
   <div class="flex-1 overflow-y-auto pr-2 mb-8 custom-scrollbar">
      <h4 class="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6 border-b border-stone-100 pb-2">This Week's Harvest</h4>
      <ul id="modal-box-items" class="space-y-0 text-sm font-medium text-nature-800 divide-y divide-stone-100">
          <!-- JS Injected -->
      </ul>
   </div>
</div>
```

### `js/views/marketplace.js` (Render Logic)
```javascript
const list = document.getElementById('modal-box-items');
list.innerHTML = box.items.map(i => `
    <li class="py-2 flex justify-between">
        <span>${i.name}</span>
        <span class="font-mono text-stone-500">x${i.qty}</span>
    </li>
`).join('');
```
