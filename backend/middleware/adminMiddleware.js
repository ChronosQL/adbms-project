const adminOnly = (req, res, next) => {
  const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'STAFF'];
  if (!adminRoles.includes(req.user?.role))
    return res.status(403).json({ message: 'Admin access required.' });
  next();
};

module.exports = { adminOnly };
