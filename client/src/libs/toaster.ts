import { toast } from 'react-toastify';

export function alertError(msg: string, noAutoClose?: boolean) {
  toast.error(msg, {
    position: 'top-center',
    autoClose: noAutoClose ? false : 2500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
}

export function alertSuccess(msg: string, noAutoClose?: boolean) {
  toast.success(msg, {
    position: 'top-center',
    autoClose: noAutoClose ? false : 2500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
}
