import { Badge } from '@/components/ui/badge'
import { AUDIT_ACTION_LABELS } from '@/features/audit/utils'
import { cn } from '@/lib/utils'
import type { AuditAction } from '@/types/audit'

const ACTION_CLASS: Record<AuditAction, string> = {
  create:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  update:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
  delete:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300',
  login:
    'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300',
  logout:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  block:
    'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300',
  unblock:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  print:
    'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  pdf: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  email:
    'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
}

interface AuditActionBadgeProps {
  action: AuditAction
}

export function AuditActionBadge({ action }: AuditActionBadgeProps) {
  return (
    <Badge variant="outline" className={cn('font-medium', ACTION_CLASS[action])}>
      {AUDIT_ACTION_LABELS[action]}
    </Badge>
  )
}
