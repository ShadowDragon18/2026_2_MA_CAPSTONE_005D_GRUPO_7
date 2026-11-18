import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { isoToTimeInput, TIME_INPUT_PATTERN } from '@/features/patients/time'

interface VisitTimeInputProps {
  isoValue: string | null
  'aria-label': string
  onCommit: (time: string) => void
}

export function VisitTimeInput({
  isoValue,
  'aria-label': ariaLabel,
  onCommit,
}: VisitTimeInputProps) {
  const committed = isoToTimeInput(isoValue)
  const [draft, setDraft] = useState(committed)
  const focusedRef = useRef(false)

  useEffect(() => {
    if (!focusedRef.current) {
      setDraft(committed)
    }
  }, [committed])

  function commit(next: string) {
    if (!TIME_INPUT_PATTERN.test(next)) {
      setDraft(committed)
      return
    }

    if (next === committed) {
      return
    }

    onCommit(next)
  }

  return (
    <Input
      type="time"
      aria-label={ariaLabel}
      className="h-8 w-[7.25rem] rounded-lg"
      value={draft}
      onFocus={() => {
        focusedRef.current = true
      }}
      onChange={(event) => {
        setDraft(event.target.value)
      }}
      onBlur={(event) => {
        focusedRef.current = false
        commit(event.currentTarget.value)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur()
        }
      }}
    />
  )
}
