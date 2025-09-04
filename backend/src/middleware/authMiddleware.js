const { admin } = require('../config/firebase');

const authMiddleware = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'Unauthorized' });
  }

  const split = authorization.split('Bearer ');
  if (split.length !== 2) {
    return res.status(401).send({ message: 'Unauthorized' });
  }

  const token = split[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    res.locals = { ...res.locals, uid: decodedToken.uid };
    req.user = { uid: decodedToken.uid };
    return next();
  } catch (err) {
    console.error(`${err.code} -  ${err.message}`);
    return res.status(401).send({ message: 'Unauthorized' });
  }
};

module.exports = authMiddleware;