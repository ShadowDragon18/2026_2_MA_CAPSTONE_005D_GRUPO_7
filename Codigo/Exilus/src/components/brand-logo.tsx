import { APP_NAME, LOGO_SRC } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  className?: string
  imgClassName?: string
}

export function BrandLogo({ className, imgClassName }: BrandLogoProps) {
  return (
    <div className={cn('inline-flex overflow-hidden rounded-xl bg-black', className)}>
      <img
        src={LOGO_SRC}
        alt={APP_NAME}
        className={cn('h-10 w-auto object-contain object-left', imgClassName)}
      />
    </div>
  )
}
