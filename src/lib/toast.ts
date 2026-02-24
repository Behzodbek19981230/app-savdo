/**
 * Toast utility functions
 * Simple wrappers around sonner toast for consistent usage
 */

import { toast as sonnerToast } from 'sonner';

export const showSuccess = (message: string) => {
	sonnerToast.success(message);
};

export const showError = (message: string) => {
	sonnerToast.error(message);
};
