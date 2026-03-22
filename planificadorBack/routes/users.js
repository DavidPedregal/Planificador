var express = require('express');
const {OAuth2Client} = require("google-auth-library");
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/login', async function(req, res) {
  const { token } = req.body;

  if (!token) return res.status(401).send('Authentication failed.');

  try {
    // Llama a la API de Google con el access_token para obtener el perfil
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!googleRes.ok) return res.status(401).send('Authentication failed.');

    const payload = await googleRes.json();
    // payload tiene: sub, name, email, picture...

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(401).send('Authentication failed.');
  }
});

module.exports = router;
