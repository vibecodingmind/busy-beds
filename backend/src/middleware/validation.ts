import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { CustomError } from './errorHandler';

// Validation middleware factory
export const validate = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error: any) => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }));
      
      res.status(400).json({ error: 'Validation failed', details: errorMessages });
      return;
    }
    
    next();
  };
};

// Common validation chains
export const commonValidations = {
  email: body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  password: body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  name: body('name').trim().notEmpty().withMessage('Name is required'),
  id: param('id').isInt({ min: 1 }).withMessage('Valid ID required'),
  
  // Hotel specific
  hotelId: body('hotel_id').isInt({ min: 1 }).withMessage('Valid hotel ID required'),
  hotelName: body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Hotel name must be 1-255 characters'),
  hotelDescription: body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description too long'),
  hotelLocation: body('location').optional().trim().isLength({ max: 500 }).withMessage('Location too long'),
  
  // Coupon specific
  couponCode: body('code').trim().isLength({ min: 3, max: 50 }).withMessage('Coupon code must be 3-50 characters'),
  discountValue: body('discount_value').trim().notEmpty().withMessage('Discount value is required'),
  
  // Pagination
  page: query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  limit: query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  // Search
  search: query('search').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Search term too long'),
};

// Validation schemas for different endpoints
export const validationSchemas = {
  // User auth
  register: [
    commonValidations.email,
    commonValidations.password,
    commonValidations.name,
  ],
  
  login: [
    commonValidations.email,
    body('password').notEmpty().withMessage('Password is required'),
  ],
  
  updateProfile: [
    body('name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Name must be 1-255 characters'),
    commonValidations.email.optional(),
    body('phone').optional().trim().isLength({ max: 50 }).withMessage('Phone must be at most 50 characters'),
    body('avatar_url').optional().trim().isLength({ max: 512 }).withMessage('Avatar URL must be at most 512 characters'),
    body('whatsapp_opt_in').optional().isBoolean().withMessage('whatsapp_opt_in must be boolean'),
  ],
  
  changePassword: [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  
  forgotPassword: [
    commonValidations.email,
  ],
  
  resetPassword: [
    body('token').notEmpty().withMessage('Reset token is required'),
    commonValidations.password,
  ],
  
  // Hotel auth
  hotelRegister: [
    commonValidations.hotelId,
    commonValidations.email,
    commonValidations.password,
    commonValidations.name,
  ],
  
  hotelLogin: [
    commonValidations.email,
    body('password').notEmpty().withMessage('Password is required'),
  ],
  
  // Hotels
  getHotel: [
    commonValidations.id,
  ],
  
  createHotel: [
    commonValidations.hotelName,
    commonValidations.hotelDescription,
    commonValidations.hotelLocation,
    body('contact_phone').optional().trim().isLength({ max: 50 }).withMessage('Phone number too long'),
    body('contact_email').optional().isEmail().normalizeEmail().withMessage('Valid contact email required'),
    body('coupon_discount_value').trim().notEmpty().withMessage('Coupon discount value is required'),
    body('coupon_limit').isInt({ min: 1, max: 1000 }).withMessage('Coupon limit must be between 1 and 1000'),
    body('limit_period').isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid limit period'),
  ],
  
  updateHotel: [
    commonValidations.id,
    commonValidations.hotelName.optional(),
    commonValidations.hotelDescription.optional(),
    commonValidations.hotelLocation.optional(),
  ],
  
  // Coupons
  getCoupon: [
    param('code').trim().isLength({ min: 3, max: 50 }).withMessage('Invalid coupon code'),
  ],
  
  createCoupon: [
    commonValidations.hotelId,
    commonValidations.couponCode,
  ],
  
  // Reviews
  createReview: [
    commonValidations.hotelId,
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment too long'),
  ],
  
  // Subscriptions
  createSubscription: [
    body('plan_id').isInt({ min: 1 }).withMessage('Valid plan ID required'),
  ],
};

// Sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove potential XSS from string fields
  const sanitizeString = (str: string): string => {
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/<[^>]*>/g, '')
              .trim();
  };
  
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };
  
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  
  next();
};
