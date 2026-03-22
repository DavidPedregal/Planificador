var express = require('express');
var router = express.Router();
const User = require("./models/UserModel");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authmiddleware");

router.post('/login', async function(req, res) {
  const { token } = req.body;

  if (!token) return res.status(401).send('Authentication failed.');

  try {
    // Llama a la API de Google con el access_token para obtener el perfil
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!googleRes.ok) return res.status(401).send('Not authenticated with Google.');

    const payload = await googleRes.json();

    let userId;
    const user = await User.findOne({ email: payload.email });
    userId = user ? user._id : null;
    if (!user) {
      const newUser = new User({
        email: payload.email, 
        fullName: payload.name, 
        name: payload.given_name,
        familyName: payload.family_name,
        profilePicture: payload.picture});
      const savedUser = await newUser.save();
      userId = savedUser._id;
    }
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
    return res.status(401).send(error.message || 'Authentication failed.');
  }
});

router.get('/verify', authMiddleware, (req, res) => {
    res.status(200).json({ ok: true });
});

module.exports = router;
