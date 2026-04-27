'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'

type Props = {
  targetName: string | null
  targetEmail: string
}

export const ImpersonationBanner = ({ targetName, targetEmail }: Props) => {
  const router = useRouter()

  const handleExit = async () => {
    await fetch('/api/admin/impersonate/exit', { method: 'POST', redirect: 'follow' })
    router.push('/admin/users')
    router.refresh()
  }

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between gap-4 text-sm">
      <div className="flex items-center gap-2 text-amber-400">
        <AlertTriangle className="size-4 shrink-0" />
        <span>
          Impersonando a <strong>{targetName ?? targetEmail}</strong> ({targetEmail})
        </span>
      </div>
      <button
        onClick={handleExit}
        className="text-xs px-3 py-1 rounded-md bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors font-medium shrink-0"
      >
        Salir
      </button>
    </div>
  )
}
