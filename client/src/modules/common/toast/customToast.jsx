// src/utils/customToast.js
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const showToast = (type = "info", message = "", options = {}) => {
  const baseClasses =
    "rounded-lg font-medium text-sm border-b-2 flex items-center shadow-lg";

  const toastOptions = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    icon: true,
    toastId: message, // 👈 prevent duplicates by message text
    ...options,
  };

  switch (type) {
    case "success":
      if (!toast.isActive(message)) {
        toast.success(message, {
          ...toastOptions,
          className: `${baseClasses} bg-green-600 text-white border-white`,
        });
      }
      break;

    case "error":
      if (!toast.isActive(message)) {
        toast.error(message, {
          ...toastOptions,
          className: `${baseClasses} bg-red-600 text-white border-white`,
        });
      }
      break;

    case "info":
      if (!toast.isActive(message)) {
        toast.info(message, {
          ...toastOptions,
          className: `${baseClasses} bg-blue-600 text-white border-white`,
        });
      }
      break;

    case "warn":
    case "warning":
      if (!toast.isActive(message)) {
        toast.warn(message, {
          ...toastOptions,
          className: `${baseClasses} bg-yellow-500 text-black border-white`,
        });
      }
      break;

    default:
      if (!toast.isActive(message)) {
        toast(message, {
          ...toastOptions,
          className: `${baseClasses} bg-gray-700 text-white border-white`,
        });
      }
      break;
  }
};
