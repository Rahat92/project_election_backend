const express = require("express");
const {
  getAllMembers,
  resetMember,
  updateMember,
} = require("../controller/getAlreadyIssuedMemberController");
const router = express.Router();
const { uploadSingle, resizeUploadedImage } = require("./../utils/fileUpload");

router.route("/").post(getAllMembers);

router.route("/reset-member").post(uploadSingle, resetMember);

router.route("/:id").post(uploadSingle, resizeUploadedImage, updateMember);

const memberRouter = router;
module.exports = memberRouter;
