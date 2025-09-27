import { useToast } from "./use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Only render toast if there's meaningful content
        const hasTitle = title && typeof title === 'string' ? title.trim() : title
        const hasDescription = description && typeof description === 'string' ? description.trim() : description

        // Skip rendering if no meaningful content
        if (!hasTitle && !hasDescription) {
          return null
        }

        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {hasTitle && <ToastTitle>{hasTitle}</ToastTitle>}
              {hasDescription && (
                <ToastDescription>{hasDescription}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
