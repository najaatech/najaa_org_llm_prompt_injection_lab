import Avatar from 'boring-avatars';

// Palette taken from the app theme so the generated avatars match the interface.
export const AVATAR_COLORS = ['#212e7e', '#0f766e', '#f59e0b', '#e11d48', '#a5b4fc'];

// Avatars are generated from the nickname only, never from the email address.
export function UserAvatar({ name, size = 32 }) {
  return <Avatar name={name || 'anonymous'} variant="beam" size={size} colors={AVATAR_COLORS} />;
}
