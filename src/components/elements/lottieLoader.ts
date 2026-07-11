// Resolves the lottie-web runtime without letting it ever land in the
// standalone player bundle (see vite.player.config.ts's alias +
// closeBundle plugin, and src/player/lottieStub.ts). In the studio app this
// import path resolves to the real dependency (lazy-loaded, code-split); in
// the player build the alias swaps it for a stub that just reads
// window.lottie, which the exported HTML shell (src/export/exportSite.ts)
// injects as a separate <script> before the player script runs.
let lottiePromise: Promise<any> | null = null;

export function loadLottie(): Promise<any> {
  if (!lottiePromise) {
    const injected = (window as any).lottie;
    lottiePromise = injected
      ? Promise.resolve(injected)
      : import('lottie-web/build/player/lottie_light').then(
          (m: any) => m.default ?? m,
          (error: unknown) => {
            // Don't cache a failed chunk load — let the next element retry.
            lottiePromise = null;
            throw error;
          }
        );
  }
  return lottiePromise;
}
