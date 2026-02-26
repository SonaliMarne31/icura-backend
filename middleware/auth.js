require('dotenv').config();
const { auth } = require('express-oauth2-jwt-bearer');
const jwt = require('jsonwebtoken');

// This function checks the JWT and ensures it's valid
// const checkJwt = auth({
//     audience: process.env.AUTH0_AUDIENCE,
//     issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
//     tokenSigningAlg: "RS256",
// });

const JWT_SECRET = process.env.JWT_SECRET; 
const JWT_EXPIRES = process.env.JWT_EXPIRES || '1h';

// BFF token contains claims, hence using it for validation and getting the claims
function verifyBffToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    //extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];

    //verify signature, expiry, issuer, audience
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'medportal-bff',
      audience: 'medportal-api',
    });

    console.log('decoded claims:', decoded);

    //attach to req.user — available in every route handler below
    req.user = {
      doctorId: decoded.doctorId,
      clinicId: decoded.clinicId,
      clinicName: decoded.clinicName,
      name: decoded.name,
      role: decoded.role,
    };

    next();

  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}


module.exports = { verifyBffToken };