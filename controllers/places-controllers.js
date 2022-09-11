const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const Place = require("../models/place");
const mongoose = require("mongoose");
const User = require("../models/user");
const fs = require("fs");
const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (error) {
    const e = new HttpError("something went wrong , could not findplace", 500);
    return next(e);
  }
  if (!place) {
    throw new HttpError("couldn't find place with this provided id ", 404);
  }
  res.json({ place: place.toObject({ getters: true }) });
};
const getPlacesByUserid = async (req, res, next) => {
  placeId = req.params.uid;

  let places;
  try {
    places = await Place.find({ creator: placeId });
  } catch {
    const error = new HttpError(
      "fetching places faild , please try again later ",
      500
    );
    return next(error);
  }
  try {
    if (!places || places.length === 0) {
      const error = new HttpError("this user dons't have any places");
      return next(error);
    }
    res.json({ places: places.map((p) => p.toObject({ getters: true })) });
  } catch {
    const error = new HttpError(
      "fetching places faild , please try again later ",
      500
    );
    return next(error);
  }
};
const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("pls check the inputs fiels  ", 404);
  }
  const { title, description, address, creator } = req.body;
  const userPlace = new Place({
    title,
    description,
    address,
    location: { lat: 40.7484474, lng: -73.9871516 },
    image: req.file.path,
    creator,
  });
  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      "Creating place falied , please try again",
      500
    );
    next(error);
  }
  if (!user) {
    const error = new HttpError("Could not find user for provided id", 404);
    next(error);
  }
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await userPlace.save({ session: sess });
    user.places.push(userPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (e) {
    const error = new HttpError("crating place falid , pls try again ", 500);
    return next(error);
  }
  res.status(201).json({ place: userPlace.toObject({ getters: true }) });
};
const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("pls check the inputs fiels  ", 404);
  }
  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (e) {
    const error = new HttpError(
      "something went wrong , could not update places",
      500
    );
    return next(error);
  }
  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError("could not update places", 401);
    return next(error);
  }
  place.title = title;
  place.description = description;
  try {
    await place.save();
  } catch (e) {
    const error = new HttpError(
      "something went wrong , could not save  updates places",
      500
    );
    return next(error);
  }
  res.status(201).json({ place: place.toObject({ getters: true }) });
};
const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch {
    const error = new HttpError(
      "something went wrong , could not save  find places",
      500
    );
    next(error);
  }
  if (!place) {
    const error = new HttpError("Could not find place foe this id", 404);
    next(error);
  }
  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError("could not delete place", 401);
    return next(error);
  }
  const imagePath = place.image;
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch {
    const error = new HttpError(
      "something went wrong , could not delete  place",
      500
    );
    next(error);
  }
  fs.unlink(imagePath, (err) => {});
  res.status(200).json({ message: "the place delete correctly" });
};
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserid = getPlacesByUserid;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
