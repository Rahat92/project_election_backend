const express = require("express");
const { uploadCandidatePhotos } = require("../controller/fileUploadController");
const { uploadCandidates } = require("../utils/uploadZipFile");

const router = express.Router();

router.route("/").post(uploadCandidates, uploadCandidatePhotos);

const fileUploadRouter = router;
module.exports = fileUploadRouter;
