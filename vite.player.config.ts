import fs from 'fs';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, Plugin } from 'vite';

// Copies lottie-web's prebuilt SVG-only runtime to dist/player/lottie.js
// after the player bundle is written. This is the ONLY way lottie-web's code
// ships in the player build — src/components/elements/lottieLoader.ts's
// import is aliased below to a stub (src/player/lottieStub.ts) so the
// library itself never gets inlined into player.js. The exported HTML shell
// (src/export/exportSite.ts) loads this file as a same-origin <script> before
// player.js, so window.lottie exists when the player's LottieElementView runs.
function copyLottiePlayerRuntime(): Plugin {
  return {
    name: 'copy-lottie-player-runtime',
    closeBundle() {
      const src = path.resolve(__dirname, 'node_modules/lottie-web/build/player/lottie_light.min.js');
      const dest = path.resolve(__dirname, 'dist/player/lottie.js');
      fs.copyFileSync(src, dest);
    },
  };
}

// Standalone build for the exported-site runtime: bundles src/player/entry.tsx
// into a single self-contained script (+ one CSS file) under dist/player, with
// no dependency on the studio app or server. See CLAUDE.md / AGENTS.md for the
// player architecture. Kept as a separate Vite config (rather than a second
// rollupOptions.input on the main build) so its output stays isolated from the
// SPA's index.html/asset graph.
export default defineConfig({
  plugins: [react(), tailwindcss(), copyLottiePlayerRuntime()],
  resolve: {
    alias: {
      // Player-purity: keep lottie-web itself out of the player IIFE (see
      // copyLottiePlayerRuntime above for how the real runtime ships instead).
      'lottie-web/build/player/lottie_light': path.resolve(__dirname, 'src/player/lottieStub.ts'),
      'lottie-web': path.resolve(__dirname, 'src/player/lottieStub.ts'),
    },
  },
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
