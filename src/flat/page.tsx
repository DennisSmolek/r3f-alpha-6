import { traceStartup } from '../startup';
import { Suspense, useCallback, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { NoToneMapping } from 'three/webgpu';
import { useSceneSettings } from './settings';
import { animationDuration, choreographyTime } from '../timeline';
import { AnnouncementScene } from './scene';
import { SceneBoundary } from '../shell/scene-boundary';
import { useWebGPUSupport } from '../shell/use-webgpu-support';
import { usePlayback } from '../shell/use-playback';
import { PlaybackControls, Scrubber } from '../shell/playback-controls';
import { Credits, SiteLinks } from '../shell/site-links';
import { AnnouncementCopy } from '../shell/announcement-copy';
import { DesignControls } from '../shell/design-controls';

export default function AnnouncementPage() {
  const { settings, setCameraPose } = useSceneSettings();
  const duration = animationDuration(settings.breakDelay);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const support = useWebGPUSupport();
  const [error, setError] = useState(false);
  const [light, setLight] = useState(false);
  const page = useRef<HTMLElement>(null);
  const player = usePlayback(settings.breakDelay, duration, elapsed => {
    const t = choreographyTime(elapsed, settings.breakDelay);
    page.current?.setAttribute('data-phase', elapsed >= duration ? 'complete' : t < 2.2 ? 'intact' : t < 5.05 ? 'breaking' : 'revealing');
    setLight(t >= 2.9);
  });
  const onError = useCallback((error: unknown) => { console.error('Announcement:', error); setError(true); }, []);
  const fallback = support === 'no' || error;
  return (
    <main ref={page} className={`announcement ${light ? 'is-light' : ''} ${fallback ? 'is-fallback' : ''} ${player.ready && !fallback ? 'is-tracked' : ''}`} aria-label="React Three Fiber v10 Alpha 6 announcement">
      {!fallback && support === 'yes' && (
        <SceneBoundary onError={onError}>
          <Canvas frameloop={player.paused && (!settings.animate || player.reducedMotion) && (settings.cameraMode !== 'Pointer' || player.reducedMotion || settings.parallax === 0) ? 'demand' : 'always'} onCreated={({ renderer }) => {
            traceStartup('Canvas ready');
            if (!(renderer as unknown as { backend?: { isWebGPUBackend?: boolean } }).backend?.isWebGPUBackend) onError(new Error('A native WebGPU backend is required'));
          }} orthographic camera={{ position: [0, 0, 1000], near: 0.1, far: 2500, zoom: 1 }} dpr={[1, 1.75]} renderer={{ antialias: true, alpha: false, toneMapping: NoToneMapping }}>
            <Suspense fallback={null}><AnnouncementScene settings={settings} onCameraPose={setCameraPose} playback={player.playback} onReady={player.onReady} onError={onError} /></Suspense>
          </Canvas>
        </SceneBoundary>
      )}
      {!player.ready && !fallback && <div className="loading" role="status" aria-label="Loading glass and typography"><span /></div>}
      <AnnouncementCopy fallback={fallback} error={error} />
      {!fallback && <DesignControls open={settingsOpen} />}
      <PlaybackControls player={player} fallback={fallback} settingsOpen={settingsOpen} onSettingsOpen={setSettingsOpen} />
      <SiteLinks />
      <Scrubber player={player} duration={duration} fallback={fallback} />
      <Credits />
    </main>
  );
}
