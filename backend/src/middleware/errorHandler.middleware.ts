// backend/src/middleware/errorHandler.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * Global Error Handler Middleware
 * Gestisce tutti gli errori in modo consistente
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log dell'errore per debugging
  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Gestione AppError (errori custom)
  if (error instanceof AppError) {
    return res.status(error.statusCode).json(
      ResponseFormatter.error(
        error.code,
        error.message,
        error.stack && process.env.NODE_ENV === 'development' ? error.stack : undefined
      )
    );
  }

  // Gestione errori Zod (validazione)
  if (error instanceof ZodError) {
    const errors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));

    return res.status(422).json(
      ResponseFormatter.error(
        'VALIDATION_ERROR',
        'I dati forniti non sono validi',
        errors,
        errors[0]?.field,
        'Controlla i campi evidenziati e riprova'
      )
    );
  }

  // Gestione errori Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const field = (error.meta?.target as string[])?.[0];
        return res.status(409).json(
          ResponseFormatter.error(
            'DUPLICATE_ERROR',
            `Il valore per ${field} è già in uso`,
            error.meta,
            field,
            'Usa un valore diverso'
          )
        );

      case 'P2003':
        // Foreign key constraint violation
        return res.status(400).json(
          ResponseFormatter.error(
            'REFERENCE_ERROR',
            'Riferimento a record inesistente',
            error.meta
          )
        );

      case 'P2025':
        // Record not found
        return res.status(404).json(
          ResponseFormatter.error(
            'NOT_FOUND',
            'Record non trovato',
            error.meta
          )
        );

      default:
        return res.status(400).json(
          ResponseFormatter.error(
            'DATABASE_ERROR',
            'Errore nel database',
            error.meta
          )
        );
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json(
      ResponseFormatter.error(
        'VALIDATION_ERROR',
        'Dati non validi per il database',
        error.message
      )
    );
  }

  // Gestione errori JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json(
      ResponseFormatter.error(
        'INVALID_TOKEN',
        'Token non valido'
      )
    );
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json(
      ResponseFormatter.error(
        'TOKEN_EXPIRED',
        'Token scaduto'
      )
    );
  }

  // Gestione errori Multer (upload files)
  if (error.name === 'MulterError') {
    let message = 'Errore upload file';
    let code = 'UPLOAD_ERROR';

    switch ((error as any).code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File troppo grande';
        code = 'FILE_TOO_LARGE';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Troppi file';
        code = 'TOO_MANY_FILES';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Campo file non previsto';
        code = 'UNEXPECTED_FIELD';
        break;
    }

    return res.status(400).json(
      ResponseFormatter.error(code, message)
    );
  }

  // Errore generico
  const statusCode = (error as any).statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Si è verificato un errore interno'
    : error.message;

  return res.status(statusCode).json(
    ResponseFormatter.error(
      'INTERNAL_ERROR',
      message,
      process.env.NODE_ENV === 'development' ? error.stack : undefined
    )
  );
};

/**
 * Middleware per gestire route non trovate
 */
export const notFoundHandler = (req: Request, res: Response) => {
  return res.status(404).json(
    ResponseFormatter.error(
      'NOT_FOUND',
      `Endpoint ${req.method} ${req.url} non trovato`
    )
  );
};

/**
 * Async error wrapper per route handlers
 * Cattura automaticamente errori async
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
