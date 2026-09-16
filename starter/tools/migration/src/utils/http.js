/**
 * Thin fetch wrapper: sets a descriptive UA (so site owners see a legible crawler,
 * not a spoofed browser string), enforces a timeout, and never throws on non-2xx —
 * callers check res.ok themselves so one bad page doesn't abort a whole crawl.
 */
const DEFAULT_TIMEOUT_MS = 15000;
const USER_AGENT = 'eds-migration-toolkit/1.0 (+https://github.com/yourorg/eds-launchpad)';

export async function fetchText(url, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,text/css,*/*' },
      signal: controller.signal,
    });
    const text = res.ok ? await res.text() : '';
    return { ok: res.ok, status: res.status, text, url: res.url || url };
  } catch (err) {
    return { ok: false, status: 0, text: '', url, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}
