import { Router } from 'express';
import { authService, authenticate } from '../services/auth.service';

const router = Router();

// Route pubbliche
router.post('/login', authService.login.bind(authService));
router.post('/register', authService.register.bind(authService));

// Route protette (richiedono autenticazione)
router.get('/me', authenticate, authService.me.bind(authService));
router.post('/logout', authenticate, authService.logout.bind(authService));

export default router;
