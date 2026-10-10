import { Component, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas, invalidate } from '@react-three/fiber';
import { NoToneMapping } from 'three/webgpu';
import { DesignControls, useSceneSettings } from './settings';
import { credits } from './credits';
import { animationDuration, choreographyTime } from './timeline';
import { AnnouncementScene, type Playback } from './scene';

class SceneBoundary extends Component<{ children: ReactNode; onError: (error: unknown) => void }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch(error: unknown) { this.props.onError(error); }
  render() { return this.state.error ? null : this.props.children; }
}

export default function AnnouncementPage() {
  const { settings, setCameraPose } = useSceneSettings();
  const duration = animationDuration(settings.breakDelay);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const previousDelay = useRef(settings.breakDelay);
  const [support, setSupport] = useState<'checking' | 'yes' | 'no'>('checking');
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [light, setLight] = useState(false);
  const playback = useRef<Playback>({ time: 0, playing: true, ready: false, reduced: false });
  const progress = useRef<HTMLInputElement>(null);
  const page = useRef<HTMLElement>(null);
  const onError = useCallback((error: unknown) => { console.error('Announcement:', error); setError(true); }, []);
  const onReady = useCallback(() => {
    playback.current.ready = true;
    setReady(true);
  }, []);

  useEffect(() => {
    const p = playback.current;
    const previous = previousDelay.current;
    p.time = p.reduced ? duration : p.time < previous
      ? (previous ? p.time / previous * settings.breakDelay : 0)
      : Math.min(duration, p.time + settings.breakDelay - previous);
    previousDelay.current = settings.breakDelay;
    invalidate();
  }, [settings.breakDelay, duration]);

  useEffect(() => {
    if (!settingsOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setSettingsOpen(false); document.getElementById('settings-toggle')?.focus(); }
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [settingsOpen]);

  useEffect(() => {
    let alive = true;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => {
      playback.current.reduced = motion.matches;
      setReducedMotion(motion.matches);
      invalidate();
      if (motion.matches) { playback.current.time = animationDuration(previousDelay.current); playback.current.playing = false; setPaused(true); }
    };
    updateMotion();
    motion.addEventListener('change', updateMotion);
    const gpu = (navigator as unknown as { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    (gpu?.requestAdapter() ?? Promise.resolve(null)).then(adapter => {
      if (alive) setSupport(adapter ? 'yes' : 'no');
    }).catch(() => { if (alive) setSupport('no'); });
    return () => { alive = false; motion.removeEventListener('change', updateMotion); };
  }, []);

  useEffect(() => {
    let id = 0;
    const update = () => {
      const elapsed = playback.current.time;
      const t = choreographyTime(elapsed, settings.breakDelay);
      if (progress.current) progress.current.value = String(elapsed);
      page.current?.setAttribute('data-phase', elapsed >= duration ? 'complete' : t < 2.2 ? 'intact' : t < 5.05 ? 'breaking' : 'revealing');
      setLight(t >= 2.9);
      if (elapsed >= duration && playback.current.playing) { playback.current.playing = false; setPaused(true); }
      id = requestAnimationFrame(update);
    };
    id = requestAnimationFrame(update);
    return () => cancelAnimationFrame(id);
  }, [duration, settings.breakDelay]);

  const replay = () => {
    playback.current.time = 0;
    playback.current.playing = true;
    setPaused(false);
    invalidate();
  };
  const toggle = () => {
    if (playback.current.time >= duration) { replay(); return; }
    playback.current.playing = !playback.current.playing;
    setPaused(!playback.current.playing);
  };
  const fallback = support === 'no' || error;
  return (
    <main ref={page} className={`announcement ${light ? 'is-light' : ''} ${fallback ? 'is-fallback' : ''}`} aria-label="React Three Fiber v10 Alpha 6 announcement">
      {!fallback && support === 'yes' && (
        <SceneBoundary onError={onError}>
          <Canvas frameloop={paused && (!settings.animate || reducedMotion) && (settings.cameraMode !== 'Pointer' || reducedMotion || settings.parallax === 0) ? 'demand' : 'always'} onCreated={({ renderer }) => {
            if (!(renderer as unknown as { backend?: { isWebGPUBackend?: boolean } }).backend?.isWebGPUBackend) onError(new Error('A native WebGPU backend is required'));
          }} orthographic camera={{ position: [0, 0, 1000], near: 0.1, far: 2500, zoom: 1 }} dpr={[1, 1.75]} renderer={{ antialias: true, alpha: false, toneMapping: NoToneMapping }}>
            <Suspense fallback={null}><AnnouncementScene settings={settings} onCameraPose={setCameraPose} playback={playback} onReady={onReady} onError={onError} /></Suspense>
          </Canvas>
        </SceneBoundary>
      )}
      {!ready && !fallback && <div className="loading" role="status" aria-label="Loading glass and typography"><span /></div>}
      <div className="semantic-copy">
        <p>Breaking Changes</p>
        <h1>r3f v10 Alpha 6 is now WebGPU First</h1>
        <p>The renderer prop falls away. Start with &lt;Canvas /&gt;.</p>
      </div>
      {fallback && <section className="fallback-copy">
        <p className="eyebrow">— Breaking Changes —</p>
        <div className="fallback-canvas">&lt;Canvas /&gt;</div>
        <h2>r3f v10 <span>Alpha 6</span></h2>
        <p>is now</p><h3>WebGPU First</h3>
        <p className="fallback-message">{error ? 'The WebGPU scene could not start. Reload to try again.' : 'Open in a browser with WebGPU enabled to experience the glass reveal.'}</p>
      </section>}
      {!fallback && <DesignControls open={settingsOpen} />}
      <div className="playback-controls">
        <button aria-label={paused ? 'Play animation' : 'Pause animation'} onClick={toggle} disabled={!ready || fallback}>
          {paused ? <svg viewBox="0 0 20 20"><path d="M7 4.5 15 10l-8 5.5Z" /></svg> : <svg viewBox="0 0 20 20"><path d="M7 5v10M13 5v10" /></svg>}
        </button>
        <button aria-label="Replay animation" onClick={replay} disabled={!ready || fallback}><svg viewBox="0 0 20 20"><path d="M4 8a6.3 6.3 0 1 1 .4 5M4 3v5h5" /></svg></button>
        <button id="settings-toggle" aria-label={settingsOpen ? 'Hide settings' : 'Show settings'} title="Settings" aria-expanded={settingsOpen} aria-controls="design-controls" onClick={() => setSettingsOpen(open => !open)} disabled={fallback}>
          <svg viewBox="0 0 20 20"><path d="M4 3v14M10 3v14M16 3v14" /><path d="M2 7h4M8 13h4M14 6h4" strokeWidth="3" /></svg>
        </button>
      </div>
      <a className="hit-area logo-link" href="https://pmnd.rs" aria-label="Poimandres"><span>Poimandres</span></a>
      <nav className="primary-links" aria-label="Explore React Three Fiber">
        <a className="hit-area" href="https://r3f.docs.pmnd.rs/getting-started/introduction"><span>Docs</span></a>
        <a className="hit-area" href="https://r3f.docs.pmnd.rs/getting-started/examples"><span>Examples</span></a>
      </nav>
      <input ref={progress} className="timeline" type="range" min="0" max={duration} step="0.01" defaultValue="0" aria-label="Animation progress" disabled={!ready || fallback} onInput={event => {
        playback.current.time = Number(event.currentTarget.value);
        playback.current.playing = false;
        setPaused(true);
        invalidate();
      }} />
      <footer className="credits" aria-label="Built with">
        {credits.map(([name, url]) => <a className="hit-area" key={name} href={url}><span>{name}</span></a>)}
      </footer>
    </main>
  );
}
