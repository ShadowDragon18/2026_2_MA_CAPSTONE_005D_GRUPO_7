import { Outlet } from 'react-router-dom'
import { AppHeader } from '@/components/app-header'
import { AppSidebar } from '@/components/app-sidebar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ClinicSettingsProvider } from '@/features/clinic/clinic-settings-provider'
import { SecurityAlertsProvider } from '@/features/security/security-alerts-provider'
import { SidebarProvider, useSidebar } from '@/layouts/sidebar-context'

function AppShell() {
  const { isMobileOpen, closeMobile } = useSidebar()

  return (
    <div className="min-h-svh bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar print:hidden lg:block">
        <AppSidebar variant="desktop" />
      </aside>

      <Sheet open={isMobileOpen} onOpenChange={(open) => !open && closeMobile()}>
        <SheetContent side="left" showCloseButton={false} className="w-72 p-0 sm:max-w-72 print:hidden">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <AppSidebar variant="drawer" />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64 print:pl-0">
        <div className="print:hidden">
          <AppHeader />
        </div>
        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function AppLayout() {
  return (
    <ClinicSettingsProvider>
      <SecurityAlertsProvider>
        <SidebarProvider>
          <AppShell />
        </SidebarProvider>
      </SecurityAlertsProvider>
    </ClinicSettingsProvider>
  )
}
