import { useState } from 'react';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onConfirm?: () => void;
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
}

export const useModal = () => {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showModal = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    options?: {
      onConfirm?: () => void;
      showCancel?: boolean;
      confirmText?: string;
      cancelText?: string;
    }
  ) => {
    setModal({
      isOpen: true,
      title,
      message,
      type,
      ...options
    });
  };

  const hideModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  const showSuccess = (title: string, message: string) => {
    showModal(title, message, 'success');
  };

  const showError = (title: string, message: string) => {
    showModal(title, message, 'error');
  };

  const showWarning = (title: string, message: string) => {
    showModal(title, message, 'warning');
  };

  const showInfo = (title: string, message: string) => {
    showModal(title, message, 'info');
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Confirmar',
    cancelText: string = 'Cancelar'
  ) => {
    showModal(title, message, 'warning', {
      onConfirm,
      showCancel: true,
      confirmText,
      cancelText
    });
  };

  return {
    modal,
    showModal,
    hideModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm
  };
};