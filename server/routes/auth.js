import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Verify token middleware
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token fehlt' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Ungültiger Token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Authentifizierung fehlgeschlagen' });
  }
};

// Get current user
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// Logout (client-side handled, but endpoint for consistency)
router.post('/logout', (req, res) => {
  res.json({ message: 'Erfolgreich abgemeldet' });
});

export { verifyToken };
export default router;
