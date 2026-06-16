import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err.name === 'MulterError') {
    const message = (err as { code?: string }).code === 'LIMIT_FILE_SIZE'
      ? 'Logo must be 2MB or smaller'
      : err.message;
    return res.status(400).json({ success: false, message });
  }

  if (err.message?.includes('Only JPEG')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
};
