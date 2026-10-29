import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from 'react'

function isDragExcluded(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false
  }

  return Boolean(target.closest('[data-no-drag]'))
}

export function useDragSelection(rowIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const dragRef = useRef<{ mode: 'add' | 'remove' } | null>(null)

  const visibleSelectedIds = useMemo(() => {
    const visible = new Set(rowIds)
    const next = new Set<string>()
    for (const id of selectedIds) {
      if (visible.has(id)) {
        next.add(id)
      }
    }
    return next
  }, [rowIds, selectedIds])

  useEffect(() => {
    const stopDrag = () => {
      dragRef.current = null
      document.body.classList.remove('select-none')
    }

    window.addEventListener('mouseup', stopDrag)
    window.addEventListener('blur', stopDrag)
    return () => {
      window.removeEventListener('mouseup', stopDrag)
      window.removeEventListener('blur', stopDrag)
    }
  }, [])

  const startDrag = useCallback((id: string, alreadySelected: boolean) => {
    const mode = alreadySelected ? 'remove' : 'add'
    dragRef.current = { mode }
    document.body.classList.add('select-none')
    setSelectedIds((current) => {
      const next = new Set(current)
      if (mode === 'add') {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  const dragOver = useCallback((id: string) => {
    const drag = dragRef.current
    if (!drag) {
      return
    }

    setSelectedIds((current) => {
      const isSelected = current.has(id)
      if (drag.mode === 'add' && isSelected) {
        return current
      }
      if (drag.mode === 'remove' && !isSelected) {
        return current
      }
      const next = new Set(current)
      if (drag.mode === 'add') {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  const handleRowPointerDown = useCallback(
    (event: MouseEvent, id: string) => {
      if (event.button !== 0 || isDragExcluded(event.target)) {
        return
      }

      startDrag(id, visibleSelectedIds.has(id))
    },
    [startDrag, visibleSelectedIds],
  )

  const toggleOne = useCallback((id: string, selected: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (selected) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback(
    (selected: boolean) => {
      setSelectedIds(selected ? new Set(rowIds) : new Set())
    },
    [rowIds],
  )

  const clear = useCallback(() => setSelectedIds(new Set()), [])

  const selectedCount = visibleSelectedIds.size
  const allSelected = rowIds.length > 0 && selectedCount === rowIds.length
  const someSelected = selectedCount > 0 && !allSelected

  return {
    selectedIds: visibleSelectedIds,
    selectedCount,
    allSelected,
    someSelected,
    handleRowPointerDown,
    dragOver,
    toggleOne,
    toggleAll,
    clear,
    isDragging: () => dragRef.current !== null,
  }
}
