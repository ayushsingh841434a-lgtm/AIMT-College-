export function destinationFor(profile) {
  if (!profile || !['student', 'management', 'admin'].includes(profile.role)) return 'login';
  if (profile.status === 'pending' || profile.status === 'rejected') return 'waiting';
  return profile.status === 'approved' ? 'dashboard' : 'login';
}
