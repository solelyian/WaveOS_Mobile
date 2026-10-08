// store.ts — mini-store externe + useSyncExternalStore.
// Pourquoi : StackNav capture les écrans comme des nœuds React figés ;
// l'état des apps vit donc dehors et chaque écran s'y abonne. Une seule
// source de vérité par app, zéro prop-drilling à travers la pile.
import { useSyncExternalStore } from "react";

export interface Store<T> {
  get(): T;
  set(fn: (s: T) => T): void;
  sub(l: () => void): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(fn) { state = fn(state); listeners.forEach(l => l()); },
    sub(l) { listeners.add(l); return () => { listeners.delete(l); }; },
  };
}

export function useStore<T>(s: Store<T>): T {
  return useSyncExternalStore(s.sub, s.get);
}
