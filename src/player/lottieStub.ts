// Player-bundle-only stub for lottie-web. vite.player.config.ts aliases both
// 'lottie-web' and 'lottie-web/build/player/lottie_light' to this file so the
// real library is never inlined into dist/player/player.js. The real
// runtime ships separately as dist/player/lottie.js (copied from
// lottie-web's lottie_light.min.js by the config's closeBundle plugin) and
// is loaded by the exported HTML shell (src/export/exportSite.ts) as
// window.lottie before the player script runs — lottieLoader.ts reads it
// from there.
export default typeof window !== 'undefined' ? (window as any).lottie : undefined;
