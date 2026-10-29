export interface Optical {
  id: string
  name: string
  colorTag: string | null
  captadorCount: number
  createdAt: string
  updatedAt: string
}

export interface OpticalFilters {
  search: string
}

export const EMPTY_OPTICAL_FILTERS: OpticalFilters = {
  search: '',
}

export interface OpticalOption {
  id: string
  name: string
}
