var express = require('express');
var router = express.Router();
import * as CalendarService from '../services/calendarService';
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authmiddleware");
const { authLimiter } = require('../middlewares/rateLimiterMiddleware');

router.post('/login', authLimiter, async function(req, res, next) {
  const { token } = req.body;

  if (!token) return res.status(401).send('Authentication failed.');

  try {
    // Llama a la API de Google con el access_token para obtener el perfil
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!googleRes.ok) return res.status(401).send('Not authenticated with Google.');

    const payload = await googleRes.json();

    const user = await CalendarService.login(payload);
    const userId = user._id;
    
    const user_token = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    return res.status(200).json(
      { token: user_token, 
        user: {
          id: userId,
          name: payload.given_name,
          email: payload.email,
        } 
      });
  } catch (error) {
    next(error);
  }
});

router.get('/verify', authMiddleware, (req, res) => {
  res.status(200).json({ ok: true }); 
});

module.exports = router;
