import { Router } from 'express';
import { athleteService } from '../services/athlete.service';
import { authenticate, authorize } from '../services/auth.service';

const router = Router();

// Applica autenticazione a tutte le route
router.use(authenticate);

// Route per gli atleti
router.get('/', athleteService.getAthletes.bind(athleteService));
router.get('/stats', athleteService.getStats.bind(athleteService));
router.get('/:id', athleteService.getAthleteById.bind(athleteService));
router.post('/', authorize('create:athletes'), athleteService.createAthlete.bind(athleteService));
router.put('/:id', authorize('update:athletes'), athleteService.updateAthlete.bind(athleteService));
router.delete('/:id', authorize('delete:athletes'), athleteService.deleteAthlete.bind(athleteService));

export default router;
