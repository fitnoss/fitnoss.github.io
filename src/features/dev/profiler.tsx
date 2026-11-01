import { Profiler, type ProfilerOnRenderCallback, type ReactNode } from "react"

// Opt in with ?profile. Keep the recorder outside React so inspecting it doesn't
// create more commits in the measured tree. No data leaves the browser.
export function profileApp(app: ReactNode) {
  const commits: { id: string; route: string; phase: string; actualDuration: number; baseDuration: number; startTime: number; commitTime: number }[] = []
  const longTasks: object[] = []
  let recording = true
  const observer = new PerformanceObserver((list) => {
    if (recording && longTasks.length < 5000) longTasks.push(...list.getEntries().map((e) => e.toJSON()))
  })
  if (PerformanceObserver.supportedEntryTypes.includes("longtask")) observer.observe({ type: "longtask" })
  const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
    if (recording && commits.length < 5000) commits.push({ id, route: location.hash, phase, actualDuration, baseDuration, startTime, commitTime })
  }
  const panel = document.createElement("details")
  panel.style.cssText = "position:fixed;right:8px;top:8px;z-index:9999;background:#111;color:#fff;padding:8px;max-width:80vw;max-height:60vh;overflow:auto;font:12px monospace"
  panel.innerHTML = '<summary>React Profiler</summary><button type="button">Snapshot</button> <button type="button">Reset</button> <button type="button">Download JSON</button><pre data-profile-report></pre>'
  const report = panel.querySelector("pre")!
  const snapshot = () => {
    if (recording) longTasks.push(...observer.takeRecords().map((e) => e.toJSON()))
    recording = false
    report.textContent = JSON.stringify({ environment: { userAgent: navigator.userAgent, mode: "development (StrictMode)", cpuThrottle: "none" }, commits, longTasks }, null, 2)
  }
  panel.querySelectorAll("button")[0].onclick = snapshot
  panel.querySelectorAll("button")[1].onclick = () => {
    commits.length = 0
    longTasks.length = 0
    observer.takeRecords()
    report.textContent = "Recording…"
    recording = true
  }
  panel.querySelectorAll("button")[2].onclick = () => {
    snapshot()
    const url = URL.createObjectURL(new Blob([report.textContent!], { type: "application/json" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "react-profile.json"
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  window.addEventListener("pagehide", () => observer.disconnect(), { once: true })
  document.body.append(panel)
  return <Profiler id="App" onRender={onRender}>{app}</Profiler>
}
