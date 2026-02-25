require('dotenv').config();
const { auth } = require('express-oauth2-jwt-bearer');

// This function checks the JWT and ensures it's valid
const checkJwt = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
    tokenSigningAlg: "RS256",
});

module.exports = { checkJwt };