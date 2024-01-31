exports.isAdmin = async (req, res, next) => {
  const db = (req) => req.app.locals.db.pcntt;
  const currentUser = req.session.user;

  if (!currentUser) {
    return res.redirect("/auth/login");
  } else {
    const query = `SELECT * FROM QUYEN WHERE user_id=@Id`;
    const inputs = [{ name: "Id", value: currentUser.id }];
    const result = (await db(req).query(query, inputs)).recordset;
    if (result.length === 0) {
      res.redirect('/auth/login');
    }
  }
  return next();
};
exports.isLogin = async (req, res, next) => {
  const currentUser = req.session.user;
  if (!currentUser) {
    return res.redirect("/auth/login");
  }
  return next();
};
