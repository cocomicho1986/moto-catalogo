function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    // Usuario autenticado, continuar
    return next();
  } else {
    // Usuario no autenticado, devolver error 401
    res.status(401).json({ success: false, message: 'No autorizado.' });
  }
}

module.exports = { isAuthenticated };