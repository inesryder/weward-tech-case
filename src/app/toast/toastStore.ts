type Toast = {
  id: number;
  message: string;
};

type Listener = () => void;

let current: Toast | null = null;
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function showToast(message: string): void {
  current = { id: nextId++, message };
  emit();
}

export function dismissToast(id: number): void {
  if (current?.id !== id) return;
  current = null;
  emit();
}

export const toastStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: (): Toast | null => current,
};
