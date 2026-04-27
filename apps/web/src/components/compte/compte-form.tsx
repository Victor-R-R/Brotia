'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { User, Save, Trash2, AlertTriangle } from 'lucide-react'

type UserData = {
  id:       string
  email:    string
  name:     string | null
  lastName: string | null
  phone:    string | null
  address:  string | null
  provider: string | null
}

const inputClass =
  'w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm ' +
  'text-foreground placeholder:text-subtle ' +
  'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary'

export const CompteForm = ({ user }: { user: UserData }) => {
  const [name,     setName]     = useState(user.name     ?? '')
  const [lastName, setLastName] = useState(user.lastName ?? '')
  const [phone,    setPhone]    = useState(user.phone    ?? '')
  const [address,  setAddress]  = useState(user.address  ?? '')

  const [saving,            setSaving]            = useState(false)
  const [deleting,          setDeleting]          = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saved,             setSaved]             = useState(false)
  const [error,             setError]             = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/user', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, lastName, phone, address }),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('No se pudo guardar. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/user', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await signOut({ redirect: true, callbackUrl: '/login' })
    } catch {
      setError('No se pudo eliminar la cuenta. Inténtalo de nuevo.')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="max-w-lg space-y-8">
      {/* Profile card */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">Datos personales</h2>
            <p className="text-xs text-muted">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Nombre</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Apellido</label>
            <input
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Tu apellido"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Teléfono</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+34 600 000 000"
              type="tel"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Dirección</label>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Tu dirección"
              className={inputClass}
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-danger-text bg-danger border border-danger-text/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {saved && (
          <p className="text-xs text-primary bg-primary/10 border border-primary/20 rounded-md px-3 py-2">
            ✓ Cambios guardados correctamente
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          <Save className="size-4" />
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>

      {/* Danger zone */}
      <div className="bg-surface border border-danger-text/20 rounded-lg p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-danger-text shrink-0" />
          <h2 className="font-heading text-base font-semibold text-danger-text">Zona de peligro</h2>
        </div>
        <p className="text-sm text-muted">
          Eliminar tu cuenta es permanente e irreversible. Se borrarán todos tus invernaderos,
          cultivos, notas y conversaciones.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 border border-danger-text/30 text-danger-text px-4 py-2 rounded-md text-sm font-medium hover:bg-danger transition-colors"
          >
            <Trash2 className="size-4" />
            Eliminar mi cuenta
          </button>
        ) : (
          <div className="bg-danger border border-danger-text/20 rounded-md p-4 space-y-3">
            <p className="text-sm font-medium text-danger-text">
              ¿Estás seguro? Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 bg-danger-text text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Trash2 className="size-4" />
                {deleting ? 'Eliminando…' : 'Sí, eliminar cuenta'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-sm text-muted hover:text-foreground transition-colors px-3 py-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
