var express = require('express');
var router = express.Router();
const UserService = require('../services/userService');
const PlanService = require('../services/planService');
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authmiddleware");
const { authLimiter, dbLimiter } = require('../middlewares/rateLimiterMiddleware');

router.post('/login', authLimiter, async function(req, res, next) {
  const { token } = req.body;

  if (!token) return res.status(401).json({ message: 'api.auth.failed' });

  try {
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!googleRes.ok) return res.status(401).json({ message: 'api.auth.notGoogle' });

    const payload = await googleRes.json();

    const user = await UserService.login(payload);
    const userId = user._id;
    await PlanService.expirePendingPlanEvents(userId);

    const user_token = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    return res.status(200).json(
      { data: {
        token: user_token,
        user: {
          id: userId,
          name: payload.given_name,
          email: payload.email,
        }
      }
      });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/verify', authMiddleware, (req, res) => {
  res.status(200).json({ ok: true });
});

router.delete('/account', dbLimiter, authMiddleware, async function(req, res, next) {
    try {
        await UserService.deleteAccount(req.userId);
        res.status(200).json({ message: 'api.user.accountDeleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;