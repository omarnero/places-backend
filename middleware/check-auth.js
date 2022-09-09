const HttpError = require("../models/http-error");
const jwt = require("jsonwebtoken");
module.exports.checkAuth = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      throw new Error("authantication falied");
    }
    const decodedtoken = jwt.verify(token, process.env.JWT_KEY);
    req.userData = { userId: decodedtoken.userId };
    next();
  } catch (err) {
    const error = new HttpError("authantication falied", 401);
    return next(error);
  }
};
