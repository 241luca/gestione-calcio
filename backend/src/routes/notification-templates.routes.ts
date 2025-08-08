// backend/src/routes/notification-templates.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ResponseFormatter } from '../utils/responseFormatter';
import { BadRequestError } from '../utils/errors';
import NotificationTemplatesService from '../services/notification-templates.service';

const router = Router();

// Tutti gli endpoint richiedono autenticazione
router.use(authenticate);

/**
 * GET /api/v1/notification-templates
 * Recupera tutti i template (sistema + custom)
 */
router.get('/',
  authorize('notifications:read'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const templates = await NotificationTemplatesService.getTemplates(
        req.user.organizationId
      );

      res.json(ResponseFormatter.success(templates));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/notification-templates/:id
 * Recupera un template specifico
 */
router.get('/:id',
  authorize('notifications:read'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const template = await NotificationTemplatesService.getTemplate(
        id,
        req.user.organizationId
      );

      if (!template) {
        throw new BadRequestError('Template non trovato');
      }

      res.json(ResponseFormatter.success(template));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/notification-templates
 * Crea nuovo template personalizzato
 */
router.post('/',
  authorize('notifications:admin'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const template = await NotificationTemplatesService.createCustomTemplate(
        req.body,
        req.user.organizationId
      );

      res.status(201).json(
        ResponseFormatter.success(template, {
          message: 'Template creato con successo'
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/v1/notification-templates/:id
 * Aggiorna template personalizzato
 */
router.put('/:id',
  authorize('notifications:admin'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const template = await NotificationTemplatesService.updateCustomTemplate(
        id,
        req.body,
        req.user.organizationId
      );

      res.json(
        ResponseFormatter.success(template, {
          message: 'Template aggiornato con successo'
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/notification-templates/:id
 * Elimina template personalizzato
 */
router.delete('/:id',
  authorize('notifications:admin'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      await NotificationTemplatesService.deleteCustomTemplate(
        id,
        req.user.organizationId
      );

      res.json(
        ResponseFormatter.success(null, {
          message: 'Template eliminato con successo'
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/notification-templates/:type/reset
 * Resetta template ai valori di sistema
 */
router.post('/:type/reset',
  authorize('notifications:admin'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { type } = req.params;
      
      await NotificationTemplatesService.resetToSystemTemplate(
        type,
        req.user.organizationId
      );

      res.json(
        ResponseFormatter.success(null, {
          message: 'Template resettato ai valori di sistema'
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/notification-templates/preview
 * Preview template con variabili
 */
router.post('/preview',
  authorize('notifications:read'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { template, variables } = req.body;
      
      const compiled = NotificationTemplatesService.compileTemplate(
        template,
        variables
      );

      res.json(ResponseFormatter.success(compiled));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/notification-templates/export
 * Esporta tutti i template
 */
router.get('/export/all',
  authorize('notifications:admin'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const json = await NotificationTemplatesService.exportTemplates(
        req.user.organizationId
      );

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="notification-templates.json"');
      res.send(json);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/v1/notification-templates/import
 * Importa template da JSON
 */
router.post('/import',
  authorize('notifications:admin'),
  async (req: any, res: Response, next: NextFunction) => {
    try {
      const { templates } = req.body;
      
      const result = await NotificationTemplatesService.importTemplates(
        JSON.stringify(templates),
        req.user.organizationId
      );

      res.json(
        ResponseFormatter.success(result, {
          message: `Importati ${result.imported} template, ${result.failed} falliti`
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

export default router;
