// PII Masking Utility
export function maskPII(value: string, type: 'email' | 'phone' | 'name'): string {
  if (!value) return '';
  switch (type) {
    case 'email':
      const [user, domain] = value.split('@');
      return user[0] + '***' + user.slice(-1) + '@' + domain;
    case 'phone':
      return value.replace(/.(?=.{4})/g, '*');
    case 'name':
      return value[0] + '***';
    default:
      return '***';
  }
}
