import Image from 'next/image'

type User = { name: string | null; lastName: string | null; avatar: string | null }

export const formatUserName = (name: string | null, lastName: string | null) =>
  [name, lastName].filter(Boolean).join(' ') || 'Usuario'

const getInitials = (user: User) =>
  [user.name?.[0], user.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'

type Props = { user: User; size?: number; className?: string }

export const UserAvatar = ({ user, size = 36, className = '' }: Props) => {
  if (user.avatar) {
    return (
      <Image
        src={user.avatar}
        alt={formatUserName(user.name, user.lastName)}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-primary/20 ${className}`}
      style={{ width: size, height: size, minWidth: size }}
    >
      <span className="text-primary font-semibold" style={{ fontSize: size * 0.38 }}>
        {getInitials(user)}
      </span>
    </div>
  )
}
