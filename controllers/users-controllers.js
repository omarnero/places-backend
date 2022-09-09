const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch {
    const error = new HttpError(
      "fetching users failed , please try again later ",
      500
    );
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};
const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError("the data enterd is not correct", 404);
    return next(error);
  }
  const { name, email, password } = req.body;
  let existinguser;
  try {
    existinguser = await User.findOne({ email: email });
  } catch {
    const error = new HttpError("signingup failed , please try again", 500);
    return next(error);
  }

  if (existinguser) {
    const error = new HttpError("user is exist aready", 422);
    return next(error);
  }
  let hashedpassword;
  try {
    hashedpassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("can't create a user ", 500);
    return next(error);
  }
  const createUser = new User({
    name,
    email,
    password: hashedpassword,
    image: req.file.path,
    places: [],
  });
  try {
    await createUser.save();
  } catch (e) {
    const error = new HttpError(
      "signingup failed to store , please try again",
      500
    );
    return next(error);
  }
  let token;
  try {
    token = jwt.sign(
      { userId: createUser.id, email: createUser.email },
      "totamylove",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "signingup failed to store , please try again",
      500
    );
    return next(error);
  }

  res
    .status(200)
    .json({ userId: createUser.id, email: createUser.email, token: token });
};
const login = async (req, res, next) => {
  const { email, password } = req.body;
  let existinguser;
  try {
    existinguser = await User.findOne({ email: email });
  } catch {
    const error = new HttpError("Login failed , please try again", 500);
    return next(error);
  }
  if (!existinguser) {
    const error = new HttpError("error in cradentials", 402);
    return next(error);
  }
  let isValidPassword;
  try {
    isValidPassword = await bcrypt.compare(password, existinguser.password);
  } catch (err) {
    const error = new HttpError("can't log in error in cradentials", 500);
    return next(error);
  }
  if (!isValidPassword) {
    const error = new HttpError("error in cradentials in password", 402);
    return next(error);
  }
  let token;
  try {
    token = jwt.sign(
      { userId: existinguser.id, email: existinguser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("login failed, please try again", 500);
    return next(error);
  }

  res.status(201).json({
    userId: existinguser.id,
    email: existinguser.email,
    token: token,
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
