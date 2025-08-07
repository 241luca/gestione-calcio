// backend/src/routes/document.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.middleware';
import documentService from '../services/document.service';
import { ResponseFormatter } from '../utils/responseFormatter';

const router = Router();

// Configurazione Multer per upload files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo file non supportato'));
    }
  }
});

// Applica autenticazione a tutte le route
router.use(authenticate);

/**
 * GET /api/v1/documents/athlete/:athleteId
 * Recupera tutti i documenti di un atleta
 */
router.get('/athlete/:athleteId', 
  authorize('documents:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { athleteId } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;

      const documents = await documentService.getAthleteDocuments(
        athleteId,
        organizationId
      );

      res.json(ResponseFormatter.success(documents));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/documents/upload
 * Upload di un nuovo documento
 */
router.post('/upload',
  authorize('documents:write'),
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json(
          ResponseFormatter.error(
            'FILE_REQUIRED',
            'Nessun file caricato'
          )
        );
      }

      const organizationId = req.headers['x-organization-id'] as string;
      const userId = (req as any).user.userId;

      // Parsing dei dati dal form
      const data = {
        athleteId: req.body.athleteId,
        typeId: parseInt(req.body.typeId),
        organizationId,
        issueDate: req.body.issueDate ? new Date(req.body.issueDate) : undefined,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
        notes: req.body.notes
      };

      // Validazioni
      if (!data.athleteId) {
        return res.status(400).json(
          ResponseFormatter.error(
            'VALIDATION_ERROR',
            'ID atleta richiesto'
          )
        );
      }

      if (!data.typeId) {
        return res.status(400).json(
          ResponseFormatter.error(
            'VALIDATION_ERROR',
            'Tipo documento richiesto'
          )
        );
      }

      const document = await documentService.uploadDocument(
        req.file,
        data,
        userId
      );

      res.status(201).json(
        ResponseFormatter.success(
          document,
          { message: 'Documento caricato con successo' }
        )
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/documents/:id/verify
 * Verifica un documento (solo admin/staff)
 */
router.put('/:id/verify',
  authorize('documents:admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;
      const { notes } = req.body;

      const document = await documentService.verifyDocument(
        id,
        userId,
        notes
      );

      res.json(
        ResponseFormatter.success(
          document,
          { message: 'Documento verificato con successo' }
        )
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/documents/:id
 * Elimina un documento
 */
router.delete('/:id',
  authorize('documents:delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const result = await documentService.deleteDocument(id);

      res.json(
        ResponseFormatter.success(
          result,
          { message: 'Documento eliminato con successo' }
        )
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/documents/stats
 * Ottieni statistiche documenti dell'organizzazione
 */
router.get('/stats',
  authorize('documents:read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.headers['x-organization-id'] as string;

      const stats = await documentService.getDocumentStats(organizationId);

      res.json(ResponseFormatter.success(stats));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/documents/check-expiring
 * Controlla documenti in scadenza (può essere chiamato manualmente o da cron)
 */
router.post('/check-expiring',
  authorize('documents:admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await documentService.checkExpiringDocuments();

      res.json(
        ResponseFormatter.success(
          result,
          { message: 'Controllo documenti completato' }
        )
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/documents/types
 * Ottieni tutti i tipi di documento disponibili
 */
router.get('/types',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Questo dovrebbe venire dal database
      // Per ora restituiamo dei tipi predefiniti
      const types = [
        { id: 1, name: 'Certificato Medico Sportivo', isRequired: true, hasExpiry: true },
        { id: 2, name: 'Documento Identità', isRequired: true, hasExpiry: true },
        { id: 3, name: 'Codice Fiscale', isRequired: true, hasExpiry: false },
        { id: 4, name: 'Foto Tessera', isRequired: false, hasExpiry: false },
        { id: 5, name: 'Consenso Privacy', isRequired: true, hasExpiry: false },
        { id: 6, name: 'Autorizzazione Genitori', isRequired: true, hasExpiry: false }
      ];

      res.json(ResponseFormatter.success(types));
    } catch (error) {
      next(error);
    }
  }
);

export default router;