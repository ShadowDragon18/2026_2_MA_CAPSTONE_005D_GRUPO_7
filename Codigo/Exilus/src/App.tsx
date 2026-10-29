import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/features/auth/auth-provider'
import { GuestOnly } from '@/features/auth/guest-only'
import { RequireAuth } from '@/features/auth/require-auth'
import { RequireRole } from '@/features/auth/require-role'
import { AppearanceSection } from '@/features/settings/appearance-section'
import { BlockedAccessSection } from '@/features/settings/blocked-access-section'
import { ClinicSection } from '@/features/settings/clinic-section'
import { ProfileSection } from '@/features/settings/profile-section'
import { SecuritySection } from '@/features/settings/security-section'
import { UsersSection } from '@/features/settings/users-section'
import { ThemeProvider } from '@/features/theme/theme-provider'
import { AppLayout } from '@/layouts/app-layout'
import { AuthLayout } from '@/layouts/auth-layout'
import { AgendaPage } from '@/pages/agenda-page'
import { AuditPage } from '@/pages/audit-page'
import { CaptadoresPage } from '@/pages/captadores-page'
import { ConsultationsPage } from '@/pages/consultations-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { ForgotPasswordPage } from '@/pages/forgot-password-page'
import { HomeRedirect } from '@/pages/home-redirect'
import { LoginPage } from '@/pages/login-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { OpticsPage } from '@/pages/optics-page'
import { PatientsPage } from '@/pages/patients-page'
import { PrescriptionsPage } from '@/pages/prescriptions-page'
import { SettingsPage } from '@/pages/settings-page'
import { UnauthorizedPage } from '@/pages/unauthorized-page'
import { UsersPage } from '@/pages/users-page'
import { WarrantyPage } from '@/pages/warranty-page'

export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
            <Route element={<GuestOnly />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/recuperar-contrasena"
                  element={<ForgotPasswordPage />}
                />
              </Route>
            </Route>

            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomeRedirect />} />
                <Route
                  path="/dashboard"
                  element={
                    <RequireRole
                      roles={['admin', 'ophthalmologist', 'reception']}
                    >
                      <DashboardPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/pacientes"
                  element={
                    <RequireRole
                      roles={['admin', 'ophthalmologist', 'reception']}
                    >
                      <PatientsPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/agenda"
                  element={
                    <RequireRole
                      roles={['admin', 'ophthalmologist', 'reception']}
                    >
                      <AgendaPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/garantia"
                  element={
                    <RequireRole
                      roles={['admin', 'ophthalmologist', 'reception']}
                    >
                      <WarrantyPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/opticas"
                  element={
                    <RequireRole
                      roles={['admin', 'ophthalmologist', 'reception']}
                    >
                      <OpticsPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/captadores"
                  element={
                    <RequireRole
                      roles={['admin', 'ophthalmologist', 'reception']}
                    >
                      <CaptadoresPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/atenciones"
                  element={
                    <RequireRole
                      roles={['admin', 'ophthalmologist', 'reception']}
                    >
                      <ConsultationsPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/recetas"
                  element={
                    <RequireRole
                      roles={['admin', 'ophthalmologist', 'reception']}
                    >
                      <PrescriptionsPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/usuarios"
                  element={
                    <RequireRole roles={['admin']}>
                      <UsersPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/auditoria"
                  element={
                    <RequireRole roles={['admin']}>
                      <AuditPage />
                    </RequireRole>
                  }
                />
                <Route path="/configuracion" element={<SettingsPage />}>
                  <Route index element={<Navigate to="perfil" replace />} />
                  <Route path="perfil" element={<ProfileSection />} />
                  <Route path="apariencia" element={<AppearanceSection />} />
                  <Route
                    path="clinica"
                    element={
                      <RequireRole roles={['admin']}>
                        <ClinicSection />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="usuarios"
                    element={
                      <RequireRole roles={['admin']}>
                        <UsersSection />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="seguridad"
                    element={
                      <RequireRole roles={['admin']}>
                        <SecuritySection />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="accesos-bloqueados"
                    element={
                      <RequireRole roles={['admin']}>
                        <BlockedAccessSection />
                      </RequireRole>
                    }
                  />
                </Route>
                <Route path="/no-autorizado" element={<UnauthorizedPage />} />
              </Route>
            </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
