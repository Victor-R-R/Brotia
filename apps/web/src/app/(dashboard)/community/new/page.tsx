'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Send } from 'lucide-react'
import { CATEGORIES } from '@/lib/community-categories'

const NewThreadPage = () => {
  const router = useRouter()
  const [title,    setTitle]    = useState('')
  const [content,  setContent]  = useState('')
  const [category, setCategory] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !category) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/community', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title, content, category, images: [] }),
      })
      if (!res.ok) { setError('No se pudo publicar. Inténtalo de nuevo.'); return }
      const thread = await res.json()
      router.push(`/community/${thread.id}`)
    } finally {
      setLoading(false)
    }
  }, [title, content, category, router])

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border px-4 lg:px-6 py-4">
        <h1 className="font-heading font-bold text-xl text-foreground">Nueva pregunta</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <form onSubmit={handleSubmit} className="max-w-xl space-y-5">

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Categoría *</label>
            <div className="relative">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                required
                className="w-full appearance-none bg-surface border border-border rounded-lg px-3 py-2.5
                           text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40
                           focus:border-primary"
              >
                <option value="" disabled>Selecciona una categoría</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.emoji} {cat.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Título *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="¿Cuál es tu pregunta?"
              maxLength={150}
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm
                         text-foreground placeholder:text-muted focus:outline-none focus:ring-2
                         focus:ring-primary/40 focus:border-primary"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Descripción *</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Describe el problema con detalle..."
              rows={6}
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm
                         text-foreground placeholder:text-muted focus:outline-none focus:ring-2
                         focus:ring-primary/40 focus:border-primary resize-none"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading || !title.trim() || !content.trim() || !category}
            className="flex items-center gap-2 bg-primary text-white font-semibold text-sm px-5 py-2.5
                       rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-40"
          >
            <Send className="size-4" />
            {loading ? 'Publicando...' : 'Publicar pregunta'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default NewThreadPage
