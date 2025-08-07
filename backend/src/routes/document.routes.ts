// backend/src/routes/document.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { DocumentService } from '../services/document.service';
import { ResponseFormatter } from '../utils/responseFormatter';

const router = Router();
const documentService = new DocumentService();

// Configurazione Multer per upload files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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
      cb(new Error('Tipo di file non supportato'));
    }
  }
});

// Applica autenticazione a tutte le route
router.use(authenticate);

/**
 * GET /api/v1/documents
 * Recupera lista documenti con filtri
 */
router.get('/', async (req: any, res: Response, next: NextFunction) => {
  try {
    const filters = {
      athleteId: req.query.athleteId,
      typeId: req.query.typeId ? parseInt(req.query.typeId) : undefined,
      status: req.query.status,
      isVerified: req.query.isVerified === 'true'
    };

    const pagination = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    const result = await documentService.getDocuments(
      req.user.organizationId,
      filters,
      pagination
    );

    res.json(ResponseFormatter.success(result));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/documents/stats
 * Statistiche documenti
 */
router.get('/stats', async (req: any, res: Response, next: NextFunction) => {
  try {
    const stats = await documentService.getDocumentStats(req.user.organizationId);
    res.json(ResponseFormatter.success(stats));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/documents/expiring
 * Documenti in scadenza
 */
router.get('/expiring', async (req: any, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const documents = await documentService.getExpiringDocuments(
      req.user.organizationId,
      days
    );
    res.json(ResponseFormatter.success(documents));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/documents/:id
 * Recupera singolo documento
 */
router.get('/:id', async (req: any, res: Response, next: NextFunction) => {
  try {
    const document = await documentService.getDocumentById(
      req.params.id,
      req.user.organizationId
    );
    res.json(ResponseFormatter.success(document));
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/documents
 * Upload nuovo documento
 */
router.post('/',
  authorize('documents:write'),
  upload.single('file'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json(
          ResponseFormatter.error('BAD_REQUEST', 'Nessun file caricato')
        );
      }

      const documentData = {
        athleteId: req.body.athleteId,
        typeId: parseInt(req.body.typeId),
        issueDate: req.body.issueDate,
        expiryDate: req.body.expiryDate,
        notes: req.body.notes,
        organizationId: req.user.organizationId,
        uploadedById: req.user.userId // Passiamo l'ID dell'utente autenticato
      };

      const document = await documentService.uploadDocument(
        req.file,
        documentData
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
 * PUT /api/v1/documents/:id/verify
 * Verifica documento
 */
router.put('/:id/verify',
  authorize('documents:verify'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const document = await documentService.verifyDocument(
        req.params.id,
        req.user.organizationId,
        req.user.userId // Passiamo l'ID dell'utente che verifica
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
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const result = await documentService.deleteDocument(
        req.params.id,
        req.user.organizationId
      );

      res.json(ResponseFormatter.success(result));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/documents/update-expired
 * Aggiorna stati documenti scaduti (cron job)
 */
router.post('/update-expired',
  authorize('documents:admin'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const result = await documentService.updateExpiredDocuments();
      res.json(ResponseFormatter.success(result));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
