import { useCallback, useEffect, useRef } from 'react'

export function useDebouncedCallback(
  callback: () => void,
  delayMs: number,
): () => void {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef<number | null>(null)

  callbackRef.current = callback

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null
      callbackRef.current()
    }, delayMs)
  }, [delayMs])
}
