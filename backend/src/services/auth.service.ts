import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema di validazione per il login
const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password deve essere almeno 6 caratteri')
});

// Schema di validazione per la registrazione
const registerSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password deve essere almeno 6 caratteri'),
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  organizationId: z.string().uuid('ID organizzazione non valido')
});

// Interfaccia per l'utente nel token JWT
export interface JWTPayload {
  userId: string;
  email: string;
  organizationId: string;
  roleId: string;
}

// Estendi Request per includere l'utente
export interface AuthRequest extends Request {
  user?: JWTPayload;
}

class AuthService {
  /**
   * Login utente
   */
  async login(req: Request, res: Response) {
    try {
      // Valida i dati
      const { email, password } = loginSchema.parse(req.body);

      // Trova l'utente
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          role: true,
          organization: true
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Email o password non corretti'
        });
      }

      // Verifica la password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Email o password non corretti'
        });
      }

      // Controlla se l'utente è attivo
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Account disattivato'
        });
      }

      // Genera il token JWT
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          organizationId: user.organizationId,
          roleId: user.roleId,
          roleName: user.role?.name,
          permissions: user.role?.permissions || []
        },
        process.env.JWT_SECRET!,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        } as SignOptions
      );

      // Aggiorna ultimo login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Rimuovi la password dalla risposta
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: {
          user: {
            ...userWithoutPassword,
            organizationName: user.organization?.name
          },
          token,
          organizationId: user.organizationId,
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(422).json({
          success: false,
          error: 'Dati non validi',
          details: error.errors
        });
      }

      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Errore durante il login'
      });
    }
  }

  /**
   * Registrazione nuovo utente
   */
  async register(req: Request, res: Response) {
    try {
      // Valida i dati
      const data = registerSchema.parse(req.body);

      // Controlla se l'email esiste già
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Email già registrata'
        });
      }

      // Hash della password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Trova il ruolo di default (es: "user")
      let defaultRole = await prisma.role.findFirst({
        where: { name: 'user' }
      });

      if (!defaultRole) {
        // Crea un ruolo di default se non esiste
        defaultRole = await prisma.role.create({
          data: {
            name: 'user',
            description: 'Utente standard',
            permissions: ['read:athletes', 'read:documents']
          }
        });
      }

      // Crea l'utente
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          organizationId: data.organizationId,
          roleId: defaultRole.id
        },
        include: {
          role: true,
          organization: true
        }
      });

      // Genera il token JWT
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          organizationId: user.organizationId,
          roleId: user.roleId,
          roleName: user.role?.name,
          permissions: user.role?.permissions || []
        },
        process.env.JWT_SECRET!,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        } as SignOptions
      );

      // Rimuovi la password dalla risposta
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        success: true,
        data: {
          user: userWithoutPassword,
          token,
          expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(422).json({
          success: false,
          error: 'Dati non validi',
          details: error.errors
        });
      }

      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Errore durante la registrazione'
      });
    }
  }

  /**
   * Verifica token e ottieni info utente
   */
  async me(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Non autenticato'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          role: true,
          organization: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Utente non trovato'
        });
      }

      // Rimuovi la password dalla risposta
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: userWithoutPassword
      });
    } catch (error) {
      console.error('Me error:', error);
      res.status(500).json({
        success: false,
        error: 'Errore recupero dati utente'
      });
    }
  }

  /**
   * Logout (opzionale - per invalidare token lato server)
   */
  async logout(req: AuthRequest, res: Response) {
    // In un'implementazione completa, qui potresti:
    // 1. Aggiungere il token a una blacklist
    // 2. Rimuovere il token da Redis/cache
    // Per ora, il logout è gestito lato client rimuovendo il token

    res.json({
      success: true,
      message: 'Logout effettuato'
    });
  }
}

export const authService = new AuthService();

/**
 * Middleware per verificare l'autenticazione
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ottieni il token dall'header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token non fornito'
      });
    }

    const token = authHeader.substring(7); // Rimuovi "Bearer "

    // Verifica il token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Aggiungi l'utente alla request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token scaduto'
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Token non valido'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Errore di autenticazione'
    });
  }
};

/**
 * Middleware per verificare i permessi
 */
export const authorize = (...requiredPermissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Non autenticato'
        });
      }

      // Ottieni il ruolo dell'utente con i permessi
      const role = await prisma.role.findUnique({
        where: { id: req.user.roleId }
      });

      if (!role) {
        return res.status(403).json({
          success: false,
          error: 'Ruolo non trovato'
        });
      }

      // Controlla se l'utente ha almeno uno dei permessi richiesti
      const userPermissions = role.permissions as string[];
      const hasPermission = requiredPermissions.some(permission =>
        userPermissions.includes(permission) || userPermissions.includes('*')
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'Permessi insufficienti'
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Errore di autorizzazione'
      });
    }
  };
};
