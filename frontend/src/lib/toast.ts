import { useToastStore, type ToastType } from '@/store/toast';

type ToastInput = string | { title?: string; message: string; duration?: number };

const DEFAULT_DURATION = 4000;

function normalize(input: ToastInput, duration = DEFAULT_DURATION) {
  if (typeof input === 'string') {
    return { message: input, duration };
  }
  return {
    title: input.title,
    message: input.message,
    duration: input.duration ?? duration,
  };
}

function show(type: ToastType, input: ToastInput, duration?: number) {
  const payload = normalize(input, duration);
  return useToastStore.getState().add({ type, ...payload });
}

export function getErrorMessage(err: unknown, fallback = 'Something went wrong') {
  if (err instanceof Error && err.message) return err.message;
  const axiosError = err as { response?: { data?: { message?: string } } };
  return axiosError.response?.data?.message || fallback;
}

export const toast = {
  success: (input: ToastInput, duration?: number) => show('success', input, duration),
  error: (input: ToastInput, duration?: number) => show('error', input, duration ?? 5000),
  info: (input: ToastInput, duration?: number) => show('info', input, duration),
  warning: (input: ToastInput, duration?: number) => show('warning', input, duration),
  dismiss: (id: string) => useToastStore.getState().remove(id),
  clear: () => useToastStore.getState().clear(),
};
