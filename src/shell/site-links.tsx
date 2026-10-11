import { credits } from '../credits';

/** Accessible hit areas laid over the logo and links drawn in the scene. */
export function SiteLinks() {
  return <>
    <a className="hit-area logo-link" href="https://pmnd.rs" aria-label="Poimandres"><svg viewBox="0 0 3.32 3.32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M0 1.16h1v1H0zM1.16 1.16h1v1h-1zM1.16 2.32h1v1h-1zM1.16 0h2.16v2.16h-1V1H1.16z" /></svg><span>Poimandres</span></a>
    <nav className="primary-links" aria-label="Explore React Three Fiber">
      <a className="hit-area" href="https://r3f.docs.pmnd.rs/getting-started/introduction"><span>Docs</span></a>
      <a className="hit-area" href="https://r3f.docs.pmnd.rs/getting-started/examples"><span>Examples</span></a>
    </nav>
  </>;
}

export function Credits() {
  return <footer className="credits" aria-label="Built with">
    {credits.map(([name, url]) => <a className="hit-area" key={name} href={url}><span>{name}</span></a>)}
  </footer>;
}
