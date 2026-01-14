# Frontend Theme Collection

Elevate your customer's shopping experience with our meticulously crafted theme collection. Each theme is more than just a color swap; it's a completely distinct visual narrative designed to evoke specific emotions and align with your brand's unique story.

Below is an overview of the frontend themes available to power your storefront.

## 1. Nature (The Modern Standard)
**"Fresh as the Morning Dew"**

*   **Vibe**: Clean, Organic, Breathable.
*   **Best For**: Modern farm-to-table brands that want to emphasize freshness and clarity.
*   **The Details**:
    *   **Typography**: Pairs the elegant *Playfair Display* for headlines with the highly readable *Inter* for interface text.
    *   **Palette**: A soothing spectrum of moss greens (`#2d4a22`), soft taupes, and crisp whites.
    *   **Visuals**: Features subtle fade-in animations and smooth slide-up transitions that make the interface deal "alive."

## 2. Heritage (The Timeless Classic)
**"Rooted in Tradition"**

*   **Vibe**: Historic, Textured, Premium.
*   **Best For**: Essential for brands with a deep history or those selling artisanal, high-value goods.
*   **The Details**:
    *   **Typography**: Uses the classic *Cormorant Garamond* to bring a sophisticated, book-like quality to your product descriptions.
    *   **Texture**: Implements a custom "noise" filter overlay to simulate the tactile feel of high-quality grain paper.
    *   **Distinctive Edge**: Uses "erratic" border radius logic to give images and cards a subtle, hand-cut appearance, moving away from the sterile perfection of standard web design.

## 3. Journal (The Storyteller)
**"Read All About It"**

*   **Vibe**: Editorial, Intellectual, Cozy.
*   **Best For**: CSAs and markets that focus heavily on the *story* behind the food—the farmers, the methods, and the seasons.
*   **The Details**:
    *   **Typography**: *Libre Baskerville* dominates the page, optimized for comfortable long-form reading.
    *   **Palette**: A warm "Aged Paper" background (`#F9F7F1`) paired with "Deep Ink" text (`#2C2B27`) creates a high-contrast yet easy-on-the-eyes reading experience.
    *   **Layout**: Features a flat, print-inspired aesthetic with zero shadows (`box-shadow: none`), referencing the layout of a premium lifestyle magazine.

## 4. Sketch (The Hand-Crafted)
**"Made by Human Hands"**

*   **Vibe**: Playful, Personal, Whimsical.
*   **Best For**: Family farms, community gardens, or brands that want to emphasize the "hand-picked" nature of their service.
*   **The Details**:
    *   **Typography**: *Permanent Marker* for headlines and *Patrick Hand* for body text creates the illusion of a handwritten note.
    *   **Components**: Every box and button features a "wobbly" border radius, mimicking imperfect hand-drawn shapes.
    *   **Colors**: A "Graphite & Eraser" palette uses pencil grays (`#373737`) to complete the sketchbook aesthetic.

## 5. Legacy (The Rustic Original)
**"Where it All Started"**

*   **Vibe**: Robust, Earthy, Familiar.
*   **Best For**: Established brands looking to maintain a connection to their original digital identity while enjoying modern performance.
*   **The Details**:
    *   **Typography**: A sturdy pairing of *Crimson Pro* and *Work Sans*.
    *   **Palette**: A high-contrast "Harvest" triad of Deep Green, Rust Gold, and Faded Red.

---

## Technical Integration
Themes are dynamically applied via `js/themes.js`. The active theme is loaded into the Tailwind configuration at runtime, allowing for instant, site-wide redesigns without changing a single line of HTML.

```javascript
// Runtime Application
import { THEMES } from './js/themes.js';
tailwind.config = { theme: { extend: activeTheme } };
```
