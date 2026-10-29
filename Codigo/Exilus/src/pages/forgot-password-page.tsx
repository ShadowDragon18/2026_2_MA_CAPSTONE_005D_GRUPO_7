import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'

export function ForgotPasswordPage() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 sm:p-8">
        <BrandLogo className="mb-6" imgClassName="h-12" />
        <h1 className="text-2xl font-semibold tracking-tight">
          Recuperar contraseña
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Exilus no ofrece registro ni recuperación pública. Solicita al
          administrador de la consulta el restablecimiento de tu acceso.
        </p>
        <Button asChild className="mt-6 rounded-lg">
          <Link to="/login">Volver al inicio de sesión</Link>
        </Button>
      </div>
    </div>
  )
}
