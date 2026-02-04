import { useCallback, useEffect, useState } from "react";
import type { StemChannels } from "@/workers/stem.types";
import { isStemWorkerResult } from "@/utils/stems/validateWorkerOutput";
import { StemWorkerResponseSchema } from "@/utils/stems/stemMessageSchema";

type StemMap = StemChannels;

type StemWorkerState = {
  ready: boolean;
  initializing: boolean;
  error: string | null;
};

type PendingEntry = {
  promise: Promise<StemMap>;
  resolve: (value: StemMap) => void;
  reject: (reason: Error) => void;
};

type StateListener = (state: StemWorkerState) => void;

type SharedStemWorker = {
  worker: Worker | null;
  ready: boolean;
  initializing: boolean;
  error: string | null;
  modelUrl: string | null;
  initPromise: Promise<void> | null;
  initResolve: (() => void) | null;
  initReject: ((error: Error) => void) | null;
  pending: Map<string, PendingEntry>;
  cache: Map<string, StemMap>;
  listeners: Set<StateListener>;
  refCount: number;
};

const shared: SharedStemWorker = {
  worker: null,
  ready: false,
  initializing: false,
  error: null,
  modelUrl: null,
  initPromise: null,
  initResolve: null,
  initReject: null,
  pending: new Map(),
  cache: new Map(),
  listeners: new Set(),
  refCount: 0,
};

const getSharedState = (): StemWorkerState => ({
  ready: shared.ready,
  initializing: shared.initializing,
  error: shared.error,
});

const notifyListeners = () => {
  const state = getSharedState();
  shared.listeners.forEach((listener) => listener(state));
};

const resetShared = (reason: string) => {
  if (shared.worker) {
    shared.worker.terminate();
  }
  shared.worker = null;
  shared.ready = false;
  shared.initializing = false;
  shared.error = null;
  shared.modelUrl = null;
  shared.initPromise = null;
  shared.initResolve = null;
  shared.initReject = null;
  shared.pending.forEach((entry) => entry.reject(new Error(reason)));
  shared.pending.clear();
  shared.cache.clear();
  notifyListeners();
};

const ensureWorker = (modelUrl: string) => {
  if (shared.worker && shared.modelUrl === modelUrl) {
    return;
  }

  if (shared.worker && shared.modelUrl !== modelUrl) {
    resetShared("Stem worker model changed");
  }

  if (shared.worker) {
    return;
  }

  const worker = new Worker(new URL("../../workers/stem.worker.ts", import.meta.url), {
    type: "module",
  });
  shared.worker = worker;
  shared.modelUrl = modelUrl;

  worker.onmessage = (event: MessageEvent) => {
    const parsed = StemWorkerResponseSchema.safeParse(event.data);
    if (!parsed.success) {
      console.warn("[StemWorker] Received unexpected response", parsed.error);
      return;
    }
    const msg = parsed.data;

    if (msg.type === "READY") {
      shared.ready = true;
      shared.initializing = false;
      shared.error = null;
      if (shared.initResolve) {
        shared.initResolve();
      }
      shared.initPromise = null;
      shared.initResolve = null;
      shared.initReject = null;
      notifyListeners();
      return;
    }

    if (msg.type === "INIT_ERROR") {
      shared.ready = false;
      shared.initializing = false;
      shared.error = msg.error ?? "Stem worker failed to initialize";
      if (shared.initReject) {
        shared.initReject(new Error(shared.error));
      }
      shared.initPromise = null;
      shared.initResolve = null;
      shared.initReject = null;
      notifyListeners();
      return;
    }

    if (isStemWorkerResult(msg)) {
      shared.cache.set(msg.id, msg.stems);
      const entry = shared.pending.get(msg.id);
      if (entry) {
        entry.resolve(msg.stems);
        shared.pending.delete(msg.id);
      }
      return;
    }

    if (msg.type === "ERROR" && msg.id) {
      const entry = shared.pending.get(msg.id);
      if (entry) {
        entry.reject(new Error(msg.error ?? "Stem worker error"));
        shared.pending.delete(msg.id);
      }
    }
  };
};

const initWorker = (modelUrl: string): Promise<void> => {
  ensureWorker(modelUrl);

  if (shared.ready) {
    return Promise.resolve();
  }

  if (shared.initPromise) {
    return shared.initPromise;
  }

  shared.initializing = true;
  shared.error = null;
  notifyListeners();

  shared.initPromise = new Promise((resolve, reject) => {
    shared.initResolve = resolve;
    shared.initReject = reject;
  });

  shared.worker?.postMessage({ type: "INIT", modelUrl });

  return shared.initPromise;
};

export type StemWorkerHandle = {
  ready: boolean;
  initializing: boolean;
  error: string | null;
  init: () => Promise<void>;
  separate: (id: string, audioBuffer: ArrayBuffer, channels?: number) => Promise<StemMap>;
};

export function useStemWorker(modelUrl: string): StemWorkerHandle {
  const [state, setState] = useState<StemWorkerState>(() => getSharedState());

  useEffect(() => {
    shared.refCount += 1;
    const listener: StateListener = (nextState) => {
      setState(nextState);
    };
    shared.listeners.add(listener);

    return () => {
      shared.listeners.delete(listener);
      shared.refCount -= 1;
      if (shared.refCount <= 0) {
        resetShared("Stem worker released");
        shared.refCount = 0;
      }
    };
  }, []);

  const init = useCallback(() => initWorker(modelUrl), [modelUrl]);

  const separate = useCallback(
    (id: string, audioBuffer: ArrayBuffer, channels: number = 1) => {
      if (shared.cache.has(id)) {
        return Promise.resolve(shared.cache.get(id)!);
      }

      if (shared.pending.has(id)) {
        return shared.pending.get(id)!.promise;
      }

      if (!shared.worker || !shared.ready) {
        return Promise.reject(new Error("Stem worker is not ready"));
      }

      let resolve: (value: StemMap) => void;
      let reject: (reason: Error) => void;
      const promise = new Promise<StemMap>((res, rej) => {
        resolve = res;
        reject = rej;
      });

      shared.pending.set(id, { promise, resolve: resolve!, reject: reject! });
      shared.worker.postMessage({ type: "SEPARATE", id, audioBuffer, channels }, [audioBuffer]);
      return promise;
    },
    []
  );

  return {
    ready: state.ready,
    initializing: state.initializing,
    error: state.error,
    init,
    separate,
  };
}
