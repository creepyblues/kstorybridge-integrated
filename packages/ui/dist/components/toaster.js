import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useToast } from "./use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport, } from "./toast";
export function Toaster() {
    const { toasts } = useToast();
    return (_jsxs(ToastProvider, { children: [toasts.map(function ({ id, title, description, action, ...props }) {
                // Only render toast if there's meaningful content
                const hasTitle = title && typeof title === 'string' ? title.trim() : title;
                const hasDescription = description && typeof description === 'string' ? description.trim() : description;
                // Skip rendering if no meaningful content
                if (!hasTitle && !hasDescription) {
                    return null;
                }
                return (_jsxs(Toast, { ...props, children: [_jsxs("div", { className: "grid gap-1", children: [hasTitle && _jsx(ToastTitle, { children: hasTitle }), hasDescription && (_jsx(ToastDescription, { children: hasDescription }))] }), action, _jsx(ToastClose, {})] }, id));
            }), _jsx(ToastViewport, {})] }));
}
