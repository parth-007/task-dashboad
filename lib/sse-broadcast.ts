type Listener = (event: string, data: string) => void;

const getListeners = (): Set<Listener> => {
  if (typeof globalThis !== "undefined") {
    const key = "__sse_broadcast_listeners__";
    if (!(globalThis as Record<string, unknown>)[key]) {
      (globalThis as Record<string, unknown>)[key] = new Set<Listener>();
    }
    return (globalThis as Record<string, unknown>)[key] as Set<Listener>;
  }
  return new Set<Listener>();
};

const listeners = getListeners();

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publish(event: string, data: string) {
  listeners.forEach((fn) => {
    try {
      fn(event, data);
    } catch {}
  });
}
