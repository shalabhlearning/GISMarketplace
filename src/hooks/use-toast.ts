import * as React from 'react'

export type ToastProps = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const listeners: Array<(toasts: ToastProps[]) => void> = []
let memoryState: ToastProps[] = []

function dispatch(toasts: ToastProps[]) {
  memoryState = toasts
  listeners.forEach((l) => l(memoryState))
}

export function toast(props: Omit<ToastProps, 'id'>) {
  const id = Math.random().toString(36).slice(2, 9)
  dispatch([...memoryState, { ...props, id, open: true }])
  return id
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>(memoryState)

  React.useEffect(() => {
    listeners.push(setToasts)
    return () => {
      const idx = listeners.indexOf(setToasts)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  return {
    toasts,
    toast,
    dismiss: (id: string) => dispatch(memoryState.filter((t) => t.id !== id)),
  }
}