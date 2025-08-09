// backend/src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { ResponseFormatter } from '../utils/responseFormatter';

/**
 * Middleware per validare il body della richiesta
 */
export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        return res.status(422).json(
          ResponseFormatter.error(
            'VALIDATION_ERROR',
            'I dati forniti non sono validi. Controlla i campi evidenziati e riprova',
            errors,
            errors[0]?.field
          )
        );
      }
      next(error);
    }
  };
};

/**
 * Middleware per validare i query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        return res.status(422).json(
          ResponseFormatter.error(
            'VALIDATION_ERROR',
            'I parametri della richiesta non sono validi',
            errors,
            errors[0]?.field
          )
        );
      }
      next(error);
    }
  };
};

/**
 * Middleware per validare i parametri dell'URL
 */
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        return res.status(422).json(
          ResponseFormatter.error(
            'VALIDATION_ERROR',
            'I parametri URL non sono validi',
            errors,
            errors[0]?.field
          )
        );
      }
      next(error);
    }
  };
};

/**
 * Middleware combinato per validare body, query e params
 */
export const validate = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query) as any;
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        return res.status(422).json(
          ResponseFormatter.error(
            'VALIDATION_ERROR',
            'Dati non validi. Verifica i dati inseriti',
            errors,
            errors[0]?.field
          )
        );
      }
      next(error);
    }
  };
};
