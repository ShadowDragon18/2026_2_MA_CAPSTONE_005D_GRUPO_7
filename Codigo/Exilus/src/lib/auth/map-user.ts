import type { User } from '@supabase/supabase-js'
import type { ProfileRow } from '@/lib/supabase/database'
import type { AuthUser } from '@/types/auth'

export function mapAuthUser(user: User, profile: ProfileRow): AuthUser {
  return {
    id: user.id,
    email: user.email ?? '',
    fullName: profile.full_name,
    role: profile.role,
    isActive: profile.is_active,
  }
}
