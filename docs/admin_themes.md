# Admin Panel Themes & Comparison

This document outlines the visual themes available in the Harvest App Admin Panel. These themes are designed to cater to different user preferences, lighting conditions, and aesthetic tastes.

## 1. Default (Harvest Standard)
The baseline theme designed for general usability and clarity.
- **Base Style**: Modern, clean, professional.
- **Color Palette**: 
  - Backgrounds: White & Light Standard Grays (`gray-50`, `gray-100`).
  - Accents: Emerald Green & Blue.
- **Typography**: Sans-Serif (Standard System Fonts).
- **Distinguishing Features**: 
  - Uses soft shadows (`shadow-md`, `shadow-lg`) for depth.
  - Rounded corners (`rounded-lg`) for a friendly, modern feel.
  - Glassmorphism effects in the header.

## 2. Minimal Theme (Paper/Wireframe)
A high-contrast, distraction-free theme inspired by architectural diagrams and paper UI.
- **Base Style**: Flat, outline-heavy, stark.
- **Color Palette**: 
  - Backgrounds: Pure White (`#ffffff`).
  - text: High-contrast Dark Gray/Black (`#111827`).
  - Borders: Light Gray (`#e5e7eb`).
- **Typography**: **Monospace** (`ui-monospace`, `Courier New`).
- **Distinguishing Features**:
  - **No Shadows**: All depth is conveyed through borders.
  - **Sharp & Boxy**: Reduced border radius (`6px` max).
  - **High Contrast**: Primary buttons are solid black; accents are removed in favor of monochrome utility.
  - **Focus**: Ideal for data density and users who prefer a "raw data" look.

## 3. Terminal Theme (Retro/Hacker)
A nostalgic, dark-mode styling reminiscent of old CRT monitors and CLI interfaces.
- **Base Style**: High-contrast Dark Mode.
- **Color Palette**: 
  - Background: Deep Black (`#0c0c0c`).
  - Foreground/Text: Neon Green (`#22c55e`).
- **Typography**: **Monospace** (`Courier New`, `Consolas`).
- **Distinguishing Features**:
  - **Zero Border Radius**: All elements are perfectly square (sharp corners).
  - **Outline Style**: Buttons and inputs rely on neon green borders rather than background fills.
  - **Global Override**: Forces *all* icons and text to Green, overriding functional colors (like red for delete) to maintain the "monochrome monitor" illusion.
  - **Input Fields**: Dark backgrounds with green text and focus rings.

## 4. John Deere Theme (The "Tractor")
A playful, brand-specific theme paying homage to agricultural roots.
- **Base Style**: Retro-Pop, Bold, "Chunky".
- **Color Palette**: 
  - Primary: **John Deere Green** (`#367C2B`).
  - Accent: **John Deere Yellow** (`#FFDE00`).
  - Background: Off-white "Crop" (`#f4f6f0`).
- **Typography**: Sans-Serif, bold weights.
- **Distinguishing Features**:
  - **Hard Shadows**: Uses solid offset shadows (retro pop visuals `box-shadow: 4px 4px 0px`).
  - **Thick Borders**: Heavy usage of 2px-4px borders in green.
  - **High Visibility**: Yellow text on Green backgrounds for the navbar.
  - **Playful**: Buttons shift position on hover (`transform: translate`) to mimic a tactile "click".

---

## Technical Implementation
Themes are implemented via CSS classes appended to the `<body>` tag:
- `theme-minimal`
- `theme-terminal`
- `theme-johndeere`

Default styles are applied when no specific theme class is present. The `cycleTheme()` function in `app.js` and `index.html` toggles these classes and persists the user's preference in `localStorage`.
