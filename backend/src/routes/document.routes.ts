// backend/src/routes/document.routes.ts
import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate, AuthRequest, authorize } from '../middleware/auth.middleware';
import { validate, validateBody, validateParams, validateQuery } from '../middleware/validation.middleware';
import { DocumentService } from '../services/document.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import { 
  createDocumentSchema,
  updateDocumentSchema,
  documentFiltersSchema,
  paginationSchema,
  idParamSchema
} from '../validators/schemas';
import { z } from 'zod';

const router = Router();
const documentService = new DocumentService();

// Configurazione Multer per upload files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo di file non supportato. Formati accettati: PDF, JPG, PNG, GIF, DOC, DOCX'));
    }
  }
});

// Applica autenticazione a tutte le route
router.use(authenticate);

/**
 * GET /api/v1/documents
 * Recupera lista documenti con filtri e paginazione
 */
router.get('/',
  validate({
    query: documentFiltersSchema.merge(paginationSchema)
  }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const { 
        page = 1, 
        limit = 50, 
        sortBy = 'createdAt', 
        sortOrder = 'desc',
        ...filters 
      } = req.query as any;

      const result = await documentService.getDocuments(
        organizationId,
        filters,
        { page, limit, sortBy, sortOrder }
      );

      res.json(ResponseFormatter.success(result));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/documents/expiring
 * Recupera documenti in scadenza
 */
router.get('/expiring',
  validate({
    query: z.object({
      days: z.string().regex(/^\d+$/).transform(Number).default('30'),
      athleteId: z.string().uuid().optional()
    })
  }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const expiringDocs = await documentService.getExpiringDocuments(
        organizationId,
        req.query.days as number,
        req.query.athleteId as string
      );

      res.json(ResponseFormatter.success(expiringDocs, {
        message: `${expiringDocs.length} documenti in scadenza nei prossimi ${req.query.days} giorni`
      }));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/documents/expired
 * Recupera documenti scaduti
 */
router.get('/expired',
  validate({
    query: z.object({
      athleteId: z.string().uuid().optional()
    })
  }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const expiredDocs = await documentService.getExpiredDocuments(
        organizationId,
        req.query.athleteId as string
      );

      res.json(ResponseFormatter.success(expiredDocs, {
        message: `${expiredDocs.length} documenti scaduti`
      }));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/documents/athlete/:athleteId
 * Recupera documenti di un atleta
 */
router.get('/athlete/:athleteId',
  validate({
    params: z.object({
      athleteId: z.string().uuid()
    }),
    query: z.object({
      status: z.enum(['VALID', 'EXPIRING', 'EXPIRED']).optional(),
      typeId: z.string().regex(/^\d+$/).transform(Number).optional()
    })
  }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const documents = await documentService.getAthleteDocuments(
        req.params.athleteId,
        organizationId,
        req.query as any
      );

      res.json(ResponseFormatter.success(documents));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/documents/types
 * Recupera tipi di documento disponibili
 */
router.get('/types',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const types = await documentService.getDocumentTypes();
      res.json(ResponseFormatter.success(types));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/documents/:id
 * Recupera dettagli singolo documento
 */
router.get('/:id',
  validateParams(idParamSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const document = await documentService.getDocumentById(
        req.params.id,
        organizationId
      );

      res.json(ResponseFormatter.success(document));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/documents/:id/download
 * Scarica un documento
 */
router.get('/:id/download',
  validateParams(idParamSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const document = await documentService.getDocumentForDownload(
        req.params.id,
        organizationId
      );

      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.send(document.buffer);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/documents
 * Carica nuovo documento
 */
router.post('/',
  authorize('documents:create'),
  upload.single('file'),
  validateBody(createDocumentSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json(
          ResponseFormatter.error(
            'FILE_REQUIRED',
            'File richiesto per il caricamento'
          )
        );
      }

      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const document = await documentService.uploadDocument(
        req.file,
        req.body,
        organizationId,
        userId
      );

      res.status(201).json(
        ResponseFormatter.success(document, {
          message: 'Documento caricato con successo'
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/documents/bulk
 * Carica più documenti
 */
router.post('/bulk',
  authorize('documents:create'),
  upload.array('files', 10),
  validateBody(z.object({
    athleteId: z.string().uuid(),
    typeId: z.number().positive(),
    expiryDate: z.string().datetime().optional()
  })),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json(
          ResponseFormatter.error(
            'FILES_REQUIRED',
            'Almeno un file richiesto per il caricamento'
          )
        );
      }

      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const result = await documentService.uploadBulkDocuments(
        req.files as Express.Multer.File[],
        req.body,
        organizationId,
        userId
      );

      res.status(201).json(
        ResponseFormatter.success(result, {
          message: `Caricati ${result.uploaded} documenti su ${result.total}`
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/documents/:id
 * Aggiorna documento
 */
router.put('/:id',
  authorize('documents:update'),
  validate({
    params: idParamSchema,
    body: updateDocumentSchema
  }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const document = await documentService.updateDocument(
        req.params.id,
        req.body,
        organizationId,
        userId
      );

      res.json(
        ResponseFormatter.success(document, {
          message: 'Documento aggiornato con successo'
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/documents/:id/verify
 * Verifica documento
 */
router.post('/:id/verify',
  authorize('documents:verify'),
  validate({
    params: idParamSchema,
    body: z.object({
      notes: z.string().optional()
    })
  }),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const document = await documentService.verifyDocument(
        req.params.id,
        organizationId,
        userId,
        req.body.notes
      );

      res.json(
        ResponseFormatter.success(document, {
          message: 'Documento verificato con successo'
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/documents/:id
 * Elimina documento
 */
router.delete('/:id',
  authorize('documents:delete'),
  validateParams(idParamSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      await documentService.deleteDocument(
        req.params.id,
        organizationId,
        userId
      );

      res.json(
        ResponseFormatter.success(null, {
          message: 'Documento eliminato con successo'
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/documents/check-expiring
 * Controlla documenti in scadenza (cron job)
 */
router.post('/check-expiring',
  authorize('documents:manage'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId;
      const result = await documentService.checkExpiringDocuments(organizationId);

      res.json(
        ResponseFormatter.success(result, {
          message: `Controllati ${result.checked} documenti, ${result.notifications} notifiche inviate`
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

export default router;
