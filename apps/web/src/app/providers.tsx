'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        dedupingInterval: 5000,
        errorRetryCount: 2,
        onError: (error) => {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[SWR Error]', error)
          }
        },
      }}
    >
      {children}
    </SWRConfig>
  )
}
