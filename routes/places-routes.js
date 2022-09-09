const express = require("express");
const { check } = require("express-validator");
const placeContoller = require("../controllers/places-controllers");
const { checkAuth } = require("../middleware/check-auth");
const fileUpload = require("../middleware/file-upload");
const router = express.Router();
router.get("/:pid", placeContoller.getPlaceById);
router.get("/user/:uid", placeContoller.getPlacesByUserid);
router.use(checkAuth);
router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placeContoller.createPlace
);
router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placeContoller.updatePlace
);
router.delete("/:pid", placeContoller.deletePlace);
module.exports = router;
