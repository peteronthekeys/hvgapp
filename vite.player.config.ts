import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Standalone build for the exported-site runtime: bundles src/player/entry.tsx
// into a single self-contained script (+ one CSS file) under dist/player, with
// no dependency on the studio app or server. See CLAUDE.md / AGENTS.md for the
// player architecture. Kept as a separate Vite config (rather than a second
// rollupOptions.input on the main build) so its output stays isolated from the
// SPA's index.html/asset graph.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist/player',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: 'src/player/entry.tsx',
      output: {
        // IIFE + inlineDynamicImports: verified this bundles cleanly despite
        // PreviewPanel's dynamic import('gsap')/import('lenis')/import('leva')
        // — Rollup inlines those into the single IIFE, and the leva branch
        // (import.meta.env.DEV-gated) is dead-code-eliminated in the
        // production build. `name` is required by the iife format even
        // though the export HTML doesn't reference the global.
        format: 'iife',
        name: 'ASPPlayer',
        inlineDynamicImports: true,
        entryFileNames: 'player.js',
        assetFileNames: 'player.[ext]',
      },
    },
  },
});
