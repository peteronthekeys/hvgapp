import React, { Suspense, useRef, useMemo, useEffect, useState, useCallback, useImperativeHandle } from 'react';
import { ProjectSchema, SceneElement } from '../types';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import type gsapType from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';
import { ScrollProgressContext } from './elements/progress';
import { elementRegistry, ScenePolishControls, DEFAULT_POLISH_CONTROLS } from './elements/registry';

export interface PreviewPlaybackHandle {
  /** Scroll from current position to the end over durationSec; resolves on arrival or stop(). */
  play(durationSec: number): Promise<void>;
  /** Jump instantly to normalized progress [0,1]. */
  seek(progress01: number): void;
  /** Cancel an in-flight play(); its promise resolves. */
  stop(): void;
  /** Total scrollable px (lenis.limit); 0 until layout settles. */
  getScrollLimitPx(): number;
}

interface PreviewPanelProps {
  schema: ProjectSchema;
  /** True when mounted inside the marketing page's demo frame: hides dev-only chrome (Leva). */
  embedded?: boolean;
  /** Imperative playback controls (play/seek/stop) for the navbar transport, driven by the shared Lenis instance. */
  playbackRef?: React.Ref<PreviewPlaybackHandle>;
}

type DevLevaControlsProps = {
  values: ScenePolishControls;
  onChange: React.Dispatch<React.SetStateAction<ScenePolishControls>>;
};

const DevLevaControls = import.meta.env.DEV
  ? React.lazy(async () => {
      const { Leva, useControls } = await import('leva');

      function DevLevaControlsPanel({ values, onChange }: DevLevaControlsProps) {
        const controls = useControls('R3F Polish', {
          bloomIntensity: { value: values.bloomIntensity, min: 0, max: 0.75, step: 0.01 },
          bloomLuminanceThreshold: { value: values.bloomLuminanceThreshold, min: 0, max: 0.8, step: 0.01 },
          vignetteDarkness: { value: values.vignetteDarkness, min: 0, max: 0.5, step: 0.01 },
          cubeRotationTurns: { value: values.cubeRotationTurns, min: 0, max: 2, step: 0.05 },
          glbRotationTurns: { value: values.glbRotationTurns, min: 0, max: 2, step: 0.05 },
          glbScale: { value: values.glbScale, min: 0.5, max: 2.5, step: 0.05 },
        });

        useEffect(() => {
          onChange(previous => {
            const next = controls as ScenePolishControls;
            if (
              previous.bloomIntensity === next.bloomIntensity &&
              previous.bloomLuminanceThreshold === next.bloomLuminanceThreshold &&
              previous.vignetteDarkness === next.vignetteDarkness &&
              previous.cubeRotationTurns === next.cubeRotationTurns &&
              previous.glbRotationTurns === next.glbRotationTurns &&
              previous.glbScale === next.glbScale
            ) {
              return previous;
            }
            return next;
          });
        }, [
          controls.bloomIntensity,
          controls.bloomLuminanceThreshold,
          controls.vignetteDarkness,
          controls.cubeRotationTurns,
          controls.glbRotationTurns,
          controls.glbScale,
          onChange,
        ]);

        return <Leva collapsed oneLineLabels />;
      }

      return { default: DevLevaControlsPanel };
    })
  : null;

function ScenePostProcessing({ polishControls }: { polishControls: ScenePolishControls }) {
  return (
    <EffectComposer multisampling={0} resolutionScale={0.75}>
      <Bloom
        intensity={polishControls.bloomIntensity}
        luminanceThreshold={polishControls.bloomLuminanceThreshold}
        luminanceSmoothing={0.45}
        mipmapBlur
      />
      <Vignette offset={0.22} darkness={polishControls.vignetteDarkness} />
    </EffectComposer>
  );
}

export function PreviewPanel({ schema, embedded = false, playbackRef }: PreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef({ current: 0 });
  const lenisRef = useRef<Lenis | null>(null);
  const pendingPlayResolveRef = useRef<(() => void) | null>(null);
  const [polishControls, setPolishControls] = useState<ScenePolishControls>(DEFAULT_POLISH_CONTROLS);

  const [engines, setEngines] = useState<{
    gsapInstance: typeof gsapType;
    scrollTrigger: typeof ScrollTriggerType;
  } | null>(null);

  // Dynamic-import GSAP + ScrollTrigger per repo perf rules; register once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ default: gsapInstance }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      gsapInstance.registerPlugin(ScrollTrigger);
      setEngines({ gsapInstance, scrollTrigger: ScrollTrigger });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Lenis drives the shared scroll container. ScrollTrigger uses the same
  // container as its scroller and stays in sync via Lenis's scroll event +
  // gsap's ticker (the standard Lenis/ScrollTrigger integration).
  useEffect(() => {
    if (!engines || !containerRef.current) return;

    const { gsapInstance, scrollTrigger } = engines;
    const container = containerRef.current;
    let lenis: Lenis;
    let rafCallback: (time: number) => void;

    (async () => {
      const { default: LenisConstructor } = await import('lenis');
      lenis = new LenisConstructor({
        wrapper: container,
        content: contentRef.current ?? undefined,
      });
      lenisRef.current = lenis;

      lenis.on('scroll', () => {
        scrollTrigger.update();
        scrollProgressRef.current.current = lenis.progress;
      });

      scrollTrigger.scrollerProxy(container, {
        scrollTop(value?: number) {
          if (arguments.length && typeof value === 'number') {
            lenis.scrollTo(value, { immediate: true });
          }
          return lenis.animatedScroll;
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: container.clientWidth,
            height: container.clientHeight,
          };
        },
      });

      rafCallback = (time: number) => {
        lenis.raf(time * 1000);
      };
      gsapInstance.ticker.add(rafCallback);
      gsapInstance.ticker.lagSmoothing(0);

      scrollTrigger.addEventListener('refresh', () => lenis.resize());
      scrollTrigger.refresh();
    })();

    return () => {
      if (rafCallback) gsapInstance.ticker.remove(rafCallback);
      lenis?.destroy();
      lenisRef.current = null;
      pendingPlayResolveRef.current?.();
      pendingPlayResolveRef.current = null;
    };
  }, [engines]);

  useImperativeHandle(
    playbackRef,
    () => ({
      play(durationSec: number) {
        return new Promise<void>(resolve => {
          const lenis = lenisRef.current;
          if (!lenis || lenis.limit <= 0) {
            resolve();
            return;
          }
          // A play() already in flight resolves rather than dangling.
          pendingPlayResolveRef.current?.();
          pendingPlayResolveRef.current = resolve;
          lenis.scrollTo(lenis.limit, {
            duration: durationSec,
            easing: (t: number) => t,
            lock: true,
            onComplete: () => {
              pendingPlayResolveRef.current?.();
              pendingPlayResolveRef.current = null;
            },
          });
        });
      },
      seek(progress01: number) {
        const lenis = lenisRef.current;
        if (!lenis) return;
        const clamped = Math.max(0, Math.min(1, progress01));
        lenis.scrollTo(clamped * lenis.limit, { immediate: true });
      },
      stop() {
        const lenis = lenisRef.current;
        if (lenis) {
          lenis.stop();
          lenis.start();
        }
        pendingPlayResolveRef.current?.();
        pendingPlayResolveRef.current = null;
      },
      getScrollLimitPx() {
        return lenisRef.current?.limit ?? 0;
      },
    }),
    []
  );

  // Calculate cumulative heights to know where each scene starts
  const sceneLayouts = useMemo(() => {
    let currentVh = 0;
    return schema.scenes.map(scene => {
      const startVh = currentVh;
      currentVh += scene.height;
      return { ...scene, startVh };
    });
  }, [schema]);

  return (
    <div className="relative h-full w-full bg-slate-900 overflow-hidden">
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          {/* Environment suspends while its CDN HDR loads; without this boundary
              the suspension escalates to the app-level route fallback and blanks
              the whole studio on any re-render. */}
          <Suspense fallback={null}>
            <Environment preset="city" />
          </Suspense>

          <ScrollProgressContext.Provider value={scrollProgressRef.current}>
            {sceneLayouts.map(scene =>
              scene.elements
                .filter(el => el.type === 'cube')
                .map(el => {
                  const CubeR3f = elementRegistry.cube?.R3f;
                  if (!CubeR3f) return null;
                  return (
                    <CubeR3f
                      key={el.id}
                      element={el}
                      ctx={{ sceneStartVh: scene.startVh, sceneHeightVh: scene.height, polishControls }}
                    />
                  );
                })
            )}
            <Suspense fallback={null}>
              {sceneLayouts.map(scene =>
                scene.elements
                  .filter(el => el.type === 'glbObject')
                  .map(el => {
                    const GlbObjectR3f = elementRegistry.glbObject?.R3f;
                    if (!GlbObjectR3f) return null;
                    return (
                      <GlbObjectR3f
                        key={el.id}
                        element={el}
                        ctx={{ sceneStartVh: scene.startVh, sceneHeightVh: scene.height, polishControls }}
                      />
                    );
                  })
              )}
            </Suspense>
          </ScrollProgressContext.Provider>
          <ScenePostProcessing polishControls={polishControls} />
        </Canvas>
      </div>

      {!embedded && DevLevaControls && (
        <Suspense fallback={null}>
          <DevLevaControls values={polishControls} onChange={setPolishControls} />
        </Suspense>
      )}

      {/* Scrollable Content Layer */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden z-20"
      >
        <div ref={contentRef} className="relative flex flex-col">
          {sceneLayouts.map(scene => (
            <div
              key={scene.id}
              className="relative w-full border-b border-slate-800/30"
              style={{ height: `${scene.height}vh` }}
            >
              {/* Sticky container that stays on screen for the duration of the scene's height */}
              <div className="sticky top-0 w-full h-[100vh] overflow-hidden pointer-events-none">
                <div className="absolute top-4 left-4 text-xs font-mono text-slate-500 uppercase tracking-widest">
                  Scene {scene.id.slice(0, 6)} ({scene.height}vh)
                </div>

                {engines && (
                  <SceneDOMObserver
                    scene={scene}
                    gsapInstance={engines.gsapInstance}
                    scrollTrigger={engines.scrollTrigger}
                    container={containerRef.current}
                    startVh={scene.startVh}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SceneDOMObserver({
  scene,
  gsapInstance,
  scrollTrigger,
  container,
  startVh,
}: {
  scene: { id: string; height: number; elements: SceneElement[] };
  gsapInstance: typeof gsapType;
  scrollTrigger: typeof ScrollTriggerType;
  container: HTMLDivElement | null;
  startVh: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ startPx: 0, heightPx: 0 });

  const updateLayout = useCallback(() => {
    const scrollContainer = ref.current?.closest('.overflow-y-auto');
    const vhPx = scrollContainer ? scrollContainer.clientHeight : window.innerHeight;

    setLayout({
      startPx: (startVh / 100) * vhPx,
      heightPx: (scene.height / 100) * vhPx,
    });
  }, [scene.height, startVh]);

  useEffect(() => {
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [updateLayout]);

  if (!container) return null;

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none">
      {layout.heightPx > 0 && scene.elements.filter(el => el.type === 'text').map(el => {
        const TextDom = elementRegistry.text?.Dom;
        if (!TextDom) return null;
        return (
          <TextDom
            key={el.id}
            element={el}
            ctx={{
              gsapInstance,
              scrollTrigger,
              container,
              sceneStartPx: layout.startPx,
              sceneHeightPx: layout.heightPx,
            }}
          />
        );
      })}
    </div>
  );
}
