import { forwardRef, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const NativeSelect = forwardRef<
  HTMLSelectElement,
  ComponentProps<'select'>
>(function NativeSelect({ className, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-[color,box-shadow] dark:bg-input/30',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    />
  )
})
