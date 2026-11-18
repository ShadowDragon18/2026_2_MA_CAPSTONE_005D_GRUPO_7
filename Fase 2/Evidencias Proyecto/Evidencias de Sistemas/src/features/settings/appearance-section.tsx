import { Monitor, Moon, Sun } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'
import type { ThemeOption } from '@/types/theme'

const THEME_CHOICES: {
  value: ThemeOption
  label: string
  description: string
  icon: typeof Sun
}[] = [
  {
    value: 'light',
    label: 'Claro',
    description: 'Fondo claro con la identidad teal de Exilus.',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Oscuro',
    description: 'Reduce el brillo y mantiene los acentos de la clínica.',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'Sistema',
    description: 'Sigue la preferencia de color de este dispositivo.',
    icon: Monitor,
  },
]

export function AppearanceSection() {
  const { theme, setTheme } = useTheme()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apariencia</CardTitle>
        <CardDescription>
          Elige el tema de Exilus. El cambio se aplica de inmediato en toda la
          aplicación.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {THEME_CHOICES.map((choice) => {
            const Icon = choice.icon
            const selected = theme === choice.value

            return (
              <button
                key={choice.value}
                type="button"
                onClick={() => setTheme(choice.value)}
                className={cn(
                  'rounded-xl border p-4 text-left transition-colors',
                  selected
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border bg-card hover:bg-muted',
                )}
              >
                <Icon className="size-5 text-primary" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  {choice.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {choice.description}
                </p>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
