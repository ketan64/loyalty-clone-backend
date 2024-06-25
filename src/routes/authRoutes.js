const express = require('express');
const jwt = require('jsonwebtoken');
const { getUserByEmail } = require('../services/user.service');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await getUserByEmail(email);

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const payload = { sub: user.id, role: user.role };
  const token = jwt.sign(payload, 'Secret_Key_For_Validation_SSQAZXSW', { expiresIn: '30m' });

  res.json({ token });
});

module.exports = router;
