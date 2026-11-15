import { cn } from '@/lib/utils'

interface FormStatusProps {
  tone: 'success' | 'error'
  message: string
}

export function FormStatus({ tone, message }: FormStatusProps) {
  return (
    <p
      className={cn(
        'rounded-lg px-3 py-2 text-sm',
        tone === 'success'
          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
          : 'bg-destructive/10 text-destructive',
      )}
    >
      {message}
    </p>
  )
}
