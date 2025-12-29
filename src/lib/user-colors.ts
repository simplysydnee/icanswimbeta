const USER_COLORS = [
  {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    bgLight: 'bg-blue-50',
    bgDark: 'bg-blue-500'
  },
  {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    bgLight: 'bg-green-50',
    bgDark: 'bg-green-500'
  },
  {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300',
    bgLight: 'bg-purple-50',
    bgDark: 'bg-purple-500'
  },
  {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300',
    bgLight: 'bg-orange-50',
    bgDark: 'bg-orange-500'
  },
  {
    bg: 'bg-pink-100',
    text: 'text-pink-800',
    border: 'border-pink-300',
    bgLight: 'bg-pink-50',
    bgDark: 'bg-pink-500'
  },
  {
    bg: 'bg-cyan-100',
    text: 'text-cyan-800',
    border: 'border-cyan-300',
    bgLight: 'bg-cyan-50',
    bgDark: 'bg-cyan-500'
  },
  {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    bgLight: 'bg-yellow-50',
    bgDark: 'bg-yellow-500'
  },
  {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    bgLight: 'bg-red-50',
    bgDark: 'bg-red-500'
  },
];

export function getUserColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

export function getUserInitials(fullName: string | null) {
  if (!fullName) return '??';
  return fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}