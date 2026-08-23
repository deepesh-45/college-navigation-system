# 📱 Mobile-First Responsiveness Guidelines & System Rules

This rule specification enforces strict, mobile-first design principles across all user interface components in this application.

---

## 🎯 Mandatory Mobile Responsiveness Principles

1. **Target Viewport Range**:
   - Primary design target: Smartphone viewports (`320px` to `480px` width).
   - Desktop & Tablet viewports must render centered mobile frame preview container (`max-w-md mx-auto shadow-2xl`).

2. **Dynamic Viewport Height (`100dvh` / `100svh`)**:
   - Use dynamic viewport height `h-[100dvh]` or `min-h-[100dvh]` instead of fixed static heights (`vh`).
   - Ensures mobile address bars (iOS Safari bottom bar & Android Chrome top bar) do not clip or cut off interactive elements.

3. **Touch-First Accessibility**:
   - Minimum touch target height for buttons and select dropdowns: `40px` (`p-2.5` / `py-3`).
   - Add `touch-action: manipulation` and active state feedback (`active:scale-95 transition-all`).

4. **Typography & Spacing Scaling**:
   - Headings: `text-base sm:text-lg` or `text-lg sm:text-xl`.
   - Subtext: `text-[10px] sm:text-xs`.
   - Padding & Gaps: `p-2 sm:p-3` and `space-y-2`.
   - Flex Wrap: Always wrap or truncate multi-line text strings to prevent horizontal scroll overflow (`truncate`, `line-clamp-2`).

5. **Modal & Overlay Rules**:
   - Fullscreen or bottom-sheet overlays on mobile screens (`fixed inset-0 z-50 p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm`).
   - Modals must feature scrollable body (`max-h-[85vh] overflow-y-auto`).
