// Public demo credentials. This is a UI demonstration, not secure authentication.
export const accounts = Object.freeze({
  student: Object.freeze({
    role: 'student', name: 'Aarav Sharma', id: 'AIMT2024001',
    email: 'student@aimt.edu', password: 'Student123!'
  }),
  management: Object.freeze({
    role: 'management', name: 'Priya Mehta', id: 'MGT001',
    email: 'manager@aimt.edu', password: 'Manager123!'
  }),
  admin: Object.freeze({
    role: 'admin', name: 'Admin User', id: 'ADMIN001',
    email: 'admin@aimt.edu', password: 'ChangeMe123!'
  })
});

export function authenticate(identifier, password) {
  if (typeof identifier !== 'string' || typeof password !== 'string') return null;
  const entered = identifier.trim().toLowerCase();
  const account = Object.values(accounts).find((candidate) =>
    entered === candidate.email.toLowerCase() || entered === candidate.id.toLowerCase());
  if (!account || password !== account.password) return null;
  return { role: account.role, id: account.id, name: account.name };
}

export function restoreAccount(value) {
  if (!value || typeof value !== 'object') return null;
  const account = accounts[value.role];
  return account && value.id === account.id ? { role: account.role, id: account.id, name: account.name } : null;
}
