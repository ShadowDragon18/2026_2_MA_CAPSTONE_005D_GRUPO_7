import { KeyRound, Pencil, Plus, ShieldOff, ShieldCheck, Trash2, Users } from 'lucide-react'
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
import { ResetPasswordDialog } from '@/features/settings/reset-password-dialog'
import type {
  CreateUserValues,
  ResetPasswordValues,
  UpdateUserValues,
} from '@/features/settings/schemas'
import { UserFormDialog } from '@/features/settings/user-form-dialog'
import {
  createManagedUser,
  deleteManagedUser,
  listManagedUsers,
  resetManagedUserPassword,
  setManagedUserActive,
  updateManagedUser,
} from '@/features/users/admin-api'
import { useAuth } from '@/hooks/use-auth'
import { formatShortDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ManagedUser } from '@/types/managed-user'
import { ROLE_LABELS } from '@/types/roles'

export function UsersSection() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<{
    tone: 'success' | 'error'
    message: string
  } | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)
  const [passwordUser, setPasswordUser] = useState<ManagedUser | null>(null)
  const [blockingUser, setBlockingUser] = useState<ManagedUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setUsers(await listManagedUsers())
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'No fue posible cargar los usuarios.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  function replaceUser(next: ManagedUser) {
    setUsers((current) =>
      current.map((item) => (item.id === next.id ? next : item)),
    )
  }

  async function handleCreate(values: CreateUserValues) {
    try {
      const created = await createManagedUser(values)
      setUsers((current) => [created, ...current])
      setFormOpen(false)
      setStatus({
        tone: 'success',
        message: `${created.fullName} ya puede iniciar sesión.`,
      })
    } catch (actionError) {
      setStatus({
        tone: 'error',
        message:
          actionError instanceof Error
            ? actionError.message
            : 'No fue posible crear el usuario.',
      })
      throw actionError
    }
  }

  async function handleUpdate(values: UpdateUserValues) {
    if (!editingUser) {
      return
    }

    try {
      const updated = await updateManagedUser({
        userId: editingUser.id,
        fullName: values.fullName,
        role: values.role,
      })
      replaceUser(updated)
      setEditingUser(null)
      setFormOpen(false)
      setStatus({
        tone: 'success',
        message: 'El usuario se actualizó correctamente.',
      })
    } catch (actionError) {
      setStatus({
        tone: 'error',
        message:
          actionError instanceof Error
            ? actionError.message
            : 'No fue posible actualizar el usuario.',
      })
      throw actionError
    }
  }

  async function handleResetPassword(values: ResetPasswordValues) {
    if (!passwordUser) {
      return
    }

    try {
      await resetManagedUserPassword({
        userId: passwordUser.id,
        password: values.password,
      })
      setPasswordUser(null)
      setStatus({
        tone: 'success',
        message: `Se restableció la contraseña de ${passwordUser.fullName}.`,
      })
    } catch (actionError) {
      setStatus({
        tone: 'error',
        message:
          actionError instanceof Error
            ? actionError.message
            : 'No fue posible restablecer la contraseña.',
      })
      throw actionError
    }
  }

  async function handleToggleActive() {
    if (!blockingUser) {
      return
    }

    try {
      const updated = await setManagedUserActive({
        userId: blockingUser.id,
        isActive: !blockingUser.isActive,
      })
      replaceUser(updated)
      setStatus({
        tone: 'success',
        message: updated.isActive
          ? `${updated.fullName} volvió a tener acceso.`
          : `${updated.fullName} quedó bloqueado.`,
      })
    } catch (actionError) {
      setStatus({
        tone: 'error',
        message:
          actionError instanceof Error
            ? actionError.message
            : 'No fue posible actualizar el acceso.',
      })
    } finally {
      setBlockingUser(null)
    }
  }

  async function handleDelete() {
    if (!deletingUser) {
      return
    }

    try {
      await deleteManagedUser(deletingUser.id)
      setUsers((current) =>
        current.filter((item) => item.id !== deletingUser.id),
      )
      setStatus({
        tone: 'success',
        message: `${deletingUser.fullName} fue eliminado.`,
      })
    } catch (actionError) {
      setStatus({
        tone: 'error',
        message:
          actionError instanceof Error
            ? actionError.message
            : 'No fue posible eliminar el usuario.',
      })
    } finally {
      setDeletingUser(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Usuarios</CardTitle>
          <CardDescription>
            Crea cuentas, cambia roles y bloquea accesos. Prefiere bloquear
            antes de eliminar.
          </CardDescription>
        </div>
        <Button
          type="button"
          className="rounded-lg"
          onClick={() => {
            setEditingUser(null)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4" />
          Nuevo usuario
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {status ? (
          <FormStatus tone={status.tone} message={status.message} />
        ) : null}
        {error ? <FormStatus tone="error" message={error} /> : null}

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin usuarios"
            description="Crea el primer usuario para que pueda iniciar sesión en Exilus."
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
                      className={cn(
                        'font-medium',
                        item.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300',
                      )}
                    >
                      {item.isActive ? 'Activo' : 'Bloqueado'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatShortDate(item.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Editar"
                        onClick={() => {
                          setEditingUser(item)
                          setFormOpen(true)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Restablecer contraseña"
                        onClick={() => setPasswordUser(item)}
                      >
                        <KeyRound />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={item.isActive ? 'Bloquear' : 'Activar'}
                        disabled={item.id === currentUser?.id}
                        onClick={() => setBlockingUser(item)}
                      >
                        {item.isActive ? <ShieldOff /> : <ShieldCheck />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Eliminar"
                        className="text-destructive hover:text-destructive"
                        disabled={item.id === currentUser?.id}
                        onClick={() => setDeletingUser(item)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <UserFormDialog
        open={formOpen}
        user={editingUser}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingUser(null)
          }
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <ResetPasswordDialog
        open={passwordUser !== null}
        user={passwordUser}
        onOpenChange={(open) => {
          if (!open) {
            setPasswordUser(null)
          }
        }}
        onSubmit={handleResetPassword}
      />

      <AlertDialog
        open={blockingUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setBlockingUser(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockingUser?.isActive ? 'Bloquear usuario' : 'Activar usuario'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockingUser?.isActive
                ? `${blockingUser.fullName} no podrá iniciar sesión en Exilus hasta que lo reactives.`
                : `¿Deseas devolver el acceso a ${blockingUser?.fullName}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={blockingUser?.isActive ? 'destructive' : 'default'}
              className="rounded-lg"
              onClick={() => {
                void handleToggleActive()
              }}
            >
              {blockingUser?.isActive ? 'Bloquear' : 'Activar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deletingUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingUser(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingUser
                ? `Esta acción elimina permanentemente a ${deletingUser.fullName}. Si solo quieres impedir el acceso, bloquéalo en su lugar.`
                : 'Esta acción no se puede deshacer.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="rounded-lg"
              onClick={() => {
                void handleDelete()
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
