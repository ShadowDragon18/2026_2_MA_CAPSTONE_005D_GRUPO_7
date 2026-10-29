import { Lock, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { EmptyState } from '@/components/empty-state'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FormStatus } from '@/features/settings/form-status'
import {
  listManagedUsers,
  setManagedUserActive,
} from '@/features/users/admin-api'
import { formatShortDate } from '@/lib/format'
import type { ManagedUser } from '@/types/managed-user'
import { ROLE_LABELS } from '@/types/roles'

export function BlockedAccessSection() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [restoringUser, setRestoringUser] = useState<ManagedUser | null>(null)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const all = await listManagedUsers()
      setUsers(all.filter((item) => !item.isActive))
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No fue posible cargar los accesos bloqueados.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  async function handleRestore() {
    if (!restoringUser) {
      return
    }

    try {
      await setManagedUserActive({
        userId: restoringUser.id,
        isActive: true,
      })
      setUsers((current) =>
        current.filter((item) => item.id !== restoringUser.id),
      )
      setStatus(`${restoringUser.fullName} volvió a tener acceso.`)
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'No fue posible activar el acceso.',
      )
    } finally {
      setRestoringUser(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accesos bloqueados</CardTitle>
        <CardDescription>
          Usuarios que no pueden iniciar sesión en Exilus hasta que un
          administrador los reactive.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status ? <FormStatus tone="success" message={status} /> : null}
        {error ? <FormStatus tone="error" message={error} /> : null}

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={Lock}
            title="Sin accesos bloqueados"
            description="Cuando bloquees un usuario, aparecerá en esta lista."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha creación</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.fullName}</TableCell>
                  <TableCell>{item.email || '—'}</TableCell>
                  <TableCell>{ROLE_LABELS[item.role]}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-red-200 bg-red-50 font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
                    >
                      Bloqueado
                    </Badge>
                  </TableCell>
                  <TableCell>{formatShortDate(item.createdAt)}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => setRestoringUser(item)}
                    >
                      <ShieldCheck className="size-3.5" />
                      Activar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AlertDialog
        open={restoringUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRestoringUser(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activar acceso</AlertDialogTitle>
            <AlertDialogDescription>
              {restoringUser
                ? `¿Deseas devolver el acceso a ${restoringUser.fullName}?`
                : '¿Deseas devolver el acceso a este usuario?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg"
              onClick={() => {
                void handleRestore()
              }}
            >
              Activar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
