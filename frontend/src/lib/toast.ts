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
  const axiosError = err as {
    response?: { data?: { message?: string; errors?: Array<{ message?: string }> } };
    message?: string;
  };
  if (axiosError.response?.data?.message) return axiosError.response.data.message;
  if (axiosError.response?.data?.errors?.[0]?.message) {
    return axiosError.response.data.errors[0].message;
  }
  if (err instanceof Error && err.message && !err.message.startsWith('Request failed with status')) {
    return err.message;
  }
  return fallback;
}

export const toast = {
  success: (input: ToastInput, duration?: number) => show('success', input, duration),
  error: (input: ToastInput, duration?: number) => show('error', input, duration ?? 5000),
  info: (input: ToastInput, duration?: number) => show('info', input, duration),
  warning: (input: ToastInput, duration?: number) => show('warning', input, duration),
  dismiss: (id: string) => useToastStore.getState().remove(id),
  clear: () => useToastStore.getState().clear(),
};
