/** The reveal choreography lasts 5.3 seconds after the initial hold. */
export function animationDuration(breakDelay: number) {
  return breakDelay + 5.3;
}

/** Keep the original choreography cues while making the opening hold editable. */
export function choreographyTime(elapsed: number, breakDelay: number) {
  return elapsed + 2.2 - breakDelay;
}
