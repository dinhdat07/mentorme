import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-white/60 selection:bg-purple-500 selection:text-white dark:bg-white/15 border-white/30 h-10 w-full min-w-0 rounded-lg border bg-white/20 px-4 py-2 text-base text-white shadow-lg transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-md md:text-sm',
        'focus-visible:border-white/50 focus-visible:ring-2 focus-visible:ring-purple-400/50 focus-visible:shadow-[0_0_20px_rgba(147,51,234,0.3)]',
        'aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
