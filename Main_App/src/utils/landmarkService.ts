import { API_CONFIG } from './config';

// ── Result types ─────────────────────────────────────────────────────────────

export interface PredictionCandidate {
  letter: string;
  confidence: number;
}

export interface PredictionResult {
  prediction: string | null;
  confidence: number;
  top3: PredictionCandidate[];
}

// ── Connection state ─────────────────────────────────────────────────────────

export type ConnectionState = 'connected' | 'connecting' | 'offline';
let onConnectionStateChange: ((state: ConnectionState) => void) | null = null;

export function setConnectionStateListener(
  cb: ((state: ConnectionState) => void) | null,
) {
  onConnectionStateChange = cb;
}

function notifyState(state: ConnectionState) {
  onConnectionStateChange?.(state);
}

// ── WebSocket connection management ─────────────────────────────────────────

let ws: WebSocket | null = null;
let wsConnecting = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 1000; // Exponential backoff: 1s → 2s → 4s → max 10s

// Monotonic request ID — used to ignore stale out-of-order responses
let nextRequestId = 0;
let pendingResolve: ((value: PredictionResult | null) => void) | null = null;
let pendingRequestId = -1;

function connectWebSocket() {
  if (ws?.readyState === WebSocket.OPEN || wsConnecting) return;
  wsConnecting = true;
  notifyState('connecting');

  try {
    const socket = new WebSocket(`${API_CONFIG.WS_URL}/ws`);

    socket.onopen = () => {
      wsConnecting = false;
      reconnectDelay = 1000;
      ws = socket;
      notifyState('connected');
      console.log('🔌 WebSocket connected');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id !== undefined && data.id !== pendingRequestId) return;

        if (pendingResolve) {
          const resolve = pendingResolve;
          pendingResolve = null;

          if (data.error && !data.top3) {
            resolve(null);
          } else {
            const result: PredictionResult = {
              prediction: data.prediction ?? null,
              confidence: data.confidence ?? 0,
              top3: data.top3 ?? [],
            };
            console.log(`✅ WS Prediction: ${result.prediction} (${(result.confidence * 100).toFixed(0)}%)`);
            resolve(result);
          }
        }
      } catch {
        // Malformed message — ignore
      }
    };

    socket.onclose = () => {
      wsConnecting = false;
      ws = null;
      if (pendingResolve) {
        pendingResolve(null);
        pendingResolve = null;
      }
      notifyState(reconnectDelay >= 10000 ? 'offline' : 'connecting');
      scheduleReconnect();
    };

    socket.onerror = () => {
      wsConnecting = false;
    };
  } catch {
    wsConnecting = false;
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectWebSocket();
  }, reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 2, 10000);
}

/** Clean up WebSocket on unmount. */
export function disconnectWebSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (ws) {
    ws.onclose = null;
    ws.close();
    ws = null;
  }
  if (pendingResolve) {
    pendingResolve(null);
    pendingResolve = null;
  }
}

// ── HTTP fallback ────────────────────────────────────────────────────────────

let currentController: AbortController | null = null;

async function sendLandmarksHTTP(landmarks: number[]): Promise<PredictionResult | null> {
  try {
    currentController?.abort();
    currentController = new AbortController();

    const res = await fetch(`${API_CONFIG.SERVER_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ landmarks }),
      signal: currentController.signal,
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();

    if (data.error && !data.top3) throw new Error(data.error);

    const result: PredictionResult = {
      prediction: data.prediction ?? null,
      confidence: data.confidence ?? 0,
      top3: data.top3 ?? [],
    };
    console.log(`✅ HTTP Prediction: ${result.prediction} (${(result.confidence * 100).toFixed(0)}%)`);
    return result;
  } catch (error: any) {
    if (error?.name === 'AbortError') return null;
    console.error("❌ Landmark prediction error:", error);
    notifyState('offline');
    return null;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export const sendLandmarks = async (landmarks: number[]): Promise<PredictionResult | null> => {
  if (landmarks.length !== 63) {
    console.warn(`⚠️ Expected 63 landmarks, got ${landmarks.length}`);
    return null;
  }

  if (ws?.readyState === WebSocket.OPEN) {
    if (pendingResolve) {
      pendingResolve(null);
      pendingResolve = null;
    }

    const id = ++nextRequestId;
    pendingRequestId = id;

    return new Promise<PredictionResult | null>((resolve) => {
      pendingResolve = resolve;

      try {
        ws!.send(JSON.stringify({ landmarks, id }));
      } catch {
        pendingResolve = null;
        return resolve(sendLandmarksHTTP(landmarks));
      }

      setTimeout(() => {
        if (pendingResolve === resolve) {
          pendingResolve = null;
          resolve(null);
        }
      }, 2000);
    });
  }

  if (!ws && !wsConnecting && !reconnectTimer) {
    connectWebSocket();
  }

  return sendLandmarksHTTP(landmarks);
};
