import { toast as hotToast } from 'react-hot-toast';

export const toast = {
  success: (message: string) => hotToast.success(message),
  error: (message: string) => hotToast.error(message),
  info: (message: string) => hotToast(message),
  loading: (message: string) => hotToast.loading(message),
};

export const showSuccess = toast.success;
export const showError = toast.error;
export const showInfo = toast.info;
