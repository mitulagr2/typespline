# Typespline - Image Text Composer

This project is a production-ready, desktop-only image editor built to fulfill the Coding Assignment. It is a single-page application developed with Next.js and TypeScript, designed to provide a polished, intuitive, and performant user experience for overlaying PNG images with fully customizable text.

The application's architecture emphasizes clean code, modularity, and robust state management to ensure a snappy and predictable editing experience.

**Live Demo:** [https://typespline.surge.sh](https://typespline.surge.sh/?ref=github)

---

## Features Checklist

This project successfully implements all core requirements and a significant number of the optional bonus points.

### Core Requirements

-   [x] **Upload PNG:** Canvas automatically matches the uploaded image's aspect ratio.
-   [x] **Multiple Text Layers:** Add and manage multiple, independent text layers.
-   [x] **Text Editing & Styling:**
    -   [x] Font Family (all Google Fonts)
    -   [x] Font Size
    -   [x] Font Weight
    -   [x] Solid Color
    -   [x] Opacity
    -   [x] Alignment (left, center, right)
    -   [x] Multi-line editing within a single text box.
-   [x] **Layer Transformation:** Drag, resize with handles, and rotate layers.
-   [x] **Layer Management:** Full control to reorder layers (bring to front, send to back, etc.).
-   [x] **Canvas UX:**
    -   [x] Snap-to-center guidelines (vertical & horizontal).
    -   [x] Nudge selected objects with arrow keys (1px default, 10px with Shift).
-   [x] **Undo/Redo:** At least 20 steps of history with a visible, interactive history indicator.
-   [x] **Autosave:** Automatically saves the current design to `localStorage`, which is restored on refresh.
-   [x] **Reset Button:** Clears the saved design and returns the editor to a blank state.
-   [x] **High-Resolution Export:** Exports the final design as a PNG, preserving the original image dimensions without scaling artifacts.

### Implemented Bonus Points

-   [x] **Multi-select with Group Transforms:** Users can select multiple objects (Shift+Click) and group them to be transformed as a single unit.
-   [x] **Ability to Edit Line-Height & Letter-Spacing:** The properties panel includes sliders for fine-grained control over text layout.
-   [x] **Lock/Unlock Layers & Duplicate Layers:** The layers panel includes controls to lock layers from accidental edits and to duplicate any selected layer.
-   [x] **Text Shadow:** A customizable drop shadow can be applied to text, with controls for color, blur, and X/Y offsets.

## Technology Choices and Trade-offs

The technology stack was chosen to meet the challenge's requirements while prioritizing performance, type safety, and a professional developer experience.

*   **Framework: Next.js 15 (App Router)**
    *   **Choice:** Next.js provides a robust, production-ready foundation with excellent performance. The App Router was used to structure the single-page application.
    *   **Trade-off:** For a purely client-side application like this, Next.js is slightly more complex than a tool like Vite. However, it was chosen for its mature ecosystem and the ease of implementing the build-time font generation script.

*   **Canvas Library: Fabric.js v5.3.0**
    *   **Choice:** Fabric.js provides a powerful and mature object model that abstracts away the complexities of low-level canvas rendering, event handling, and object transformation. This significantly accelerated development.
    *   **Trade-off:** Fabric.js is an imperative, object-oriented library. Integrating it into React's declarative world presents a key architectural challenge. This was overcome by creating custom hooks (`useFabric`, `useHistory`) and a robust state synchronization pattern to serve as a "bridge" between the two paradigms.

*   **UI Components: ShadCN/ui**
    *   **Choice:** ShadCN provides beautifully designed, accessible, and themeable components that are built on top of Tailwind CSS. A key advantage is that you "own" the code—components are added via a CLI directly into the project, allowing for full customization.
    *   **Trade-off:** Unlike a traditional component library, ShadCN requires a one-time setup and the manual addition of each component via the CLI. This is a small initial cost for the benefit of ultimate control and ownership.

*   **State Management: React Hooks**
    *   **Choice:** To keep the dependency footprint small and the architecture clean, the application's state is managed using React's built-in hooks. Custom hooks (`useHistory`) encapsulate complex, stateful logic.
    *   **Trade-off:** While perfectly sufficient for this application's scope, a larger project with more complex, deeply nested global state might benefit from a dedicated state management library like Zustand to further decouple state logic from the UI.

*   **Static Font Generation**
    *   **Choice:** To keep the application fully static and the Google Fonts API key secure, a `prebuild` Node.js script fetches the font list at build time and saves it to a local JSON file.
    *   **Trade-off:** The font list is only as fresh as the last build. It will not update in real-time if Google adds new fonts. This is a very acceptable trade-off for the significant gains in security and performance.

## Concise Description of the Architecture

The application is built on a clean, modular architecture designed for maintainability and scalability.

1.  **Custom Hooks for Core Logic:**
    *   `useFabric`: Manages the entire lifecycle of the Fabric.js canvas, handling initialization and safe disposal to prevent memory leaks.
    *   `useHistory`: Implements the complex undo/redo and autosave logic using an **"Imperative-First, Declarative-Last"** pattern. It performs the async canvas operations first, and only updates the React state within the final callback to prevent race conditions and UI inconsistency.

2.  **Controlled Components with Debouncing:**
    *   The `RightSidebar` is a fully controlled component with its own local state, providing instant UI feedback for all property inputs.
    *   It uses a debounced function (`lodash.debounce`) to update the canvas and save to history. This ensures a highly performant and responsive experience with sliders while preventing the history from being flooded with micro-changes.

## Known Limitations

*   **Performance at Scale:** While performant for typical use cases, the application may experience performance degradation if a user adds hundreds of complex text objects to the canvas.
*   **Error Handling:** UI feedback for certain edge cases (e.g., if the local font list fails to load) is minimal. A production app would include more user-facing error messages.
*   **Browser Compatibility:** The application is built for and tested on modern evergreen browsers (Chrome, Firefox, Safari). It is not optimized for older browsers like Internet Explorer.
*   **No Curved Text/Warping:** The bonus point for warping text along a path was not implemented due to its complexity and was considered out of scope for the core challenge.

## Setup and Run Instructions

### 1. Prerequisites
*   Node.js (v18 or later)
*   npm or pnpm or bun

### 2. Clone the Repository
```bash
git clone https://github.com/mitulagr2/typespline.git
cd typespline
```

### 3. Install Dependencies
```bash
npm install
```

### 4. (Optional) Set Up Environment Variables
Create a file named `.env.local` in the project root. You must add your Google Fonts API key here for the `prebuild` script.
```
GOOGLE_FONTS_API_KEY=YourApiKeyHere
```
*(An API key can be obtained from the Google Cloud Console.)*

### 5. Generate the Static Font List
This script runs automatically before every build, but you can run it manually for development:
```bash
node scripts/fetch-fonts.js
```

### 6. Run the Development Server
```bash
npm run dev
```
The application will be available at [http://localhost:3000](http://localhost:3000).
