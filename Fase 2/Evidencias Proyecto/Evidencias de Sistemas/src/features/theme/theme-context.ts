import { createContext } from 'react'
import type { ThemeOption } from '@/types/theme'

export interface ThemeContextValue {
  theme: ThemeOption
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: ThemeOption) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
