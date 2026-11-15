const REMEMBER_FLAG_KEY = 'exilus.auth.remember'

export const AUTH_STORAGE_KEY = 'exilus.auth'

export function setRememberPreference(remember: boolean): void {
  if (remember) {
    localStorage.setItem(REMEMBER_FLAG_KEY, '1')
    return
  }

  localStorage.removeItem(REMEMBER_FLAG_KEY)
}

export function clearRememberPreference(): void {
  localStorage.removeItem(REMEMBER_FLAG_KEY)
}

export function createAuthStorage(): Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
> {
  return {
    getItem: (key) => {
      return localStorage.getItem(key) ?? sessionStorage.getItem(key)
    },
    setItem: (key, value) => {
      const remember = localStorage.getItem(REMEMBER_FLAG_KEY) === '1'

      if (remember) {
        localStorage.setItem(key, value)
        sessionStorage.removeItem(key)
        return
      }

      sessionStorage.setItem(key, value)
      localStorage.removeItem(key)
    },
    removeItem: (key) => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    },
  }
}
