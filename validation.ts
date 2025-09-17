// ENTERPRISE-GRADE VALIDATION UTILITIES
export function validateEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export function validatePassword(password: string): boolean {
  // At least 8 chars, 1 letter, 1 number
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);
}

export function validateRequired(value: any): boolean {
  return value !== undefined && value !== null && value !== '';
}