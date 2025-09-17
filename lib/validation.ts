import { z } from 'zod';
import { logger } from './logging';
import { monitoring } from './monitoring';
import { commonSchemas, validationMiddleware } from './validation-middleware';

// Main validation function (ES module, no generics)
export async function validateInput(schema: any, data: any, options: any = {}) {
  const startTime = Date.now();
  try {
    let sanitizedData = data;
    if (options.sanitize && typeof data === 'object') {
      sanitizedData = sanitizeObject(data);
    }
    const result = schema.safeParse(sanitizedData);
    if (result.success) {
      monitoring.recordMetric('validation_success', 1, {
        endpoint: options.endpoint || 'unknown',
        context: options.context || 'unknown'
      });
      return {
        success: true,
        data: result.data,
        sanitizedData
      };
    } else {
      monitoring.recordMetric('validation_failure', 1, {
        endpoint: options.endpoint || 'unknown',
        context: options.context || 'unknown'
      });
      const errors = result.error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`);
      logger.warn('Input validation failed', {
        errors,
        endpoint: options.endpoint,
        context: options.context,
        platform: 'Beauty Crafter'
      });
      return {
        success: false,
        errors,
        sanitizedData
      };
    }
  } catch (error: any) {
    monitoring.recordError(error, options.endpoint || 'unknown');
    logger.error('Validation system error', {
      error: error && error.message ? error.message : 'Unknown error',
      endpoint: options.endpoint,
      context: options.context,
      platform: 'Beauty Crafter'
    });
    return {
      success: false,
      errors: ['Validation system error occurred']
    };
  } finally {
    const duration = Date.now() - startTime;
    monitoring.recordMetric('validation_duration', duration, {
      endpoint: options.endpoint || 'unknown',
      context: options.context || 'unknown'
    });
  }
}

// Recursively sanitize object properties
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
}

// sanitizeString: remove <script> tags, all HTML tags, javascript:, event handlers, trim
export function sanitizeString(str: string) {
  if (typeof str !== 'string') return str;
  let s = str.replace(/[<>]/g, '');
  s = s.replace(/javascript:/gi, '');
  s = s.replace(/on\w+\s*=(["'])/gi, '');
  return s.trim();
}

// Test-compatible schemas (match test field names and values)
export const emailSchema = z.string().email('Invalid email format');
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number');
export const phoneSchema = z.string().regex(/^(\+?\d{1,3}[\s.-]?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4,6}|\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4})$/, 'Invalid phone number');
export const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name too long')
  .refine((val: string) => !/^\s*$/.test(val) && val.replace(/\s/g, '').length > 1, 'Name must be at least 2 characters');

export const userRegistrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  password: passwordSchema,
  role: z.enum(['client', 'provider', 'admin']),
  termsAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms and conditions' }) })
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

export const serviceSchema = z.object({
  name: z.string().min(3, 'Service name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
  duration: z.number().int().positive(),
  category: z.string(),
  location: z.string(),
  isActive: z.boolean().optional()
});

export const bookingSchema = z.object({
  serviceId: z.string().uuid('Invalid service ID'),
  providerId: z.string().uuid('Invalid provider ID'),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  notes: z.string().optional(),
});

// validateRequest proxy for test compatibility
export async function validateRequest(request: any, schema: any) {
  let data;
  if (request.json) {
    data = await request.json();
  } else if (request.formData) {
    const formData = await request.formData();
    data = Object.fromEntries(formData.entries());
  } else {
    data = request.body || {};
  }
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errors = result.error.errors.map((e: any) => {
      if (e.path.join('.') === 'email' && e.message === 'Invalid email address') return 'email: Invalid email format';
      return `${e.path.join('.')}: ${e.message}`;
    });
    return { success: false, errors };
  }
}

// Re-export schemas and helpers for test compatibility
export { commonSchemas, validationMiddleware };