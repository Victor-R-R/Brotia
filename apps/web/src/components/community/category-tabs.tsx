'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { CATEGORIES } from '@/lib/community-categories'

export const CategoryTabs = () => {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const active      = searchParams.get('category') ?? ''

  const select = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (key) params.set('category', key)
    else params.delete('category')
    router.push(`/community?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => select('')}
        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
          active === ''
            ? 'bg-primary text-white border-primary'
            : 'bg-surface text-muted border-border hover:border-primary/40 hover:text-foreground'
        }`}
      >
        Todos
      </button>
      {CATEGORIES.map(cat => (
        <button
          key={cat.key}
          onClick={() => select(cat.key)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            active === cat.key
              ? 'bg-primary text-white border-primary'
              : 'bg-surface text-muted border-border hover:border-primary/40 hover:text-foreground'
          }`}
        >
          {cat.emoji} {cat.label}
        </button>
      ))}
    </div>
  )
}
