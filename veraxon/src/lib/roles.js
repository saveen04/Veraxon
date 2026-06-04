export const ROLE_STUDENT = 'student';
export const ROLE_STAFF = 'staff';
export const ROLE_ADMIN = 'admin';

export function isStaffRole(role) {
  return role === ROLE_STAFF || role === ROLE_ADMIN;
}

export function isStudentRole(role) {
  return role === ROLE_STUDENT;
}

export function normalizeRole(role) {
  if (isStaffRole(role)) return ROLE_STAFF;
  if (isStudentRole(role)) return ROLE_STUDENT;
  return null;
}

export function getDashboardRoute(role) {
  if (isStaffRole(role)) return '/staff/dashboard';
  if (isStudentRole(role)) return '/student/dashboard';
  return '/login';
}

export function getRoleLabel(role) {
  if (isStaffRole(role)) return 'staff';
  if (isStudentRole(role)) return 'student';
  return 'user';
}
