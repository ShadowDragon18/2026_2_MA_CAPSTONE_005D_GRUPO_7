import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PaymentStatus } from '@/types/patient'

const STATUS_CLASS: Record<PaymentStatus, string> = {
  Pagado:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  'P/P':
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant="outline" className={cn('font-medium', STATUS_CLASS[status])}>
      {status}
    </Badge>
  )
}
