// A small shared switch. It is used only in the browser.
// A counter is used (not true/false), so two buttons at the same time
// cannot turn the pause off too early.
let pauseCount = 0;

export function pauseAutoRefresh() {
  pauseCount += 1;
}

export function resumeAutoRefresh() {
  pauseCount = Math.max(0, pauseCount - 1);
}

export function isAutoRefreshPaused() {
  return pauseCount > 0;
}