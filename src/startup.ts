export function traceStartup(stage: string) {
  if (new URLSearchParams(location.search).has('debug')) console.info('[r3f startup]', stage);
}
