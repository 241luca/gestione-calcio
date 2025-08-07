import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estendi il tipo Request per includere l'utente
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    organizationId: string;
    roleId?: string;
    roleName?: string;
    permissions?: string[];
  };
}

/**
 * Middleware per verificare l'autenticazione JWT
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Estrai il token dall'header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token di autenticazione mancante'
        }
      });
    }

    const token = authHeader.substring(7); // Rimuovi "Bearer "

    // Verifica il token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key') as any;

    // Aggiungi i dati utente alla request
    req.user = {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      organizationId: decoded.organizationId || req.headers['x-organization-id'] as string,
      roleId: decoded.roleId,
      roleName: decoded.roleName || 'user',
      permissions: decoded.permissions || []
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token scaduto'
        }
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token non valido'
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Errore di autenticazione'
      }
    });
  }
};

/**
 * Middleware per verificare i permessi
 */
export const authorize = (...requiredPermissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Non autenticato'
        }
      });
    }

    // Admin ha sempre tutti i permessi
    if (req.user.roleName === 'admin' || req.user.roleName === 'super_admin') {
      return next();
    }

    // Se non ci sono permessi richiesti specifici, permetti l'accesso (per le route che richiedono solo autenticazione)
    if (requiredPermissions.length === 0) {
      return next();
    }

    // Verifica se l'utente ha almeno uno dei permessi richiesti
    const hasPermission = requiredPermissions.some(permission => {
      // Permesso esatto
      if (req.user?.permissions?.includes(permission)) {
        return true;
      }

      // Permesso wildcard (es: "payments:*" permette "payments:read", "payments:write", ecc.)
      const [resource] = permission.split(':');
      return req.user?.permissions?.includes(`${resource}:*`) || 
             req.user?.permissions?.includes('*:*');
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Permessi insufficienti per questa operazione'
        }
      });
    }

    next();
  };
};

/**
 * Middleware per verificare l'appartenenza all'organizzazione
 */
export const checkOrganization = (req: AuthRequest, res: Response, next: NextFunction) => {
  const organizationId = req.headers['x-organization-id'] as string;
  
  if (!organizationId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_ORGANIZATION',
        message: 'Organization ID mancante negli headers'
      }
    });
  }

  // Se l'utente ha un'organizzazione specifica, verifica che corrisponda
  if (req.user?.organizationId && req.user.organizationId !== organizationId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'WRONG_ORGANIZATION',
        message: 'Non hai accesso a questa organizzazione'
      }
    });
  }

  // Aggiungi l'organizationId all'utente se non presente
  if (req.user && !req.user.organizationId) {
    req.user.organizationId = organizationId;
  }

  next();
};
