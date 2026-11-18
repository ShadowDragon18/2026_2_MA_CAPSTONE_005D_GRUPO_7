import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-svh bg-background">
      <Outlet />
    </div>
  )
}
