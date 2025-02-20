const express = require("express");
const {
  getAlreadyIssuedMembers,
  getAMember,
  getAllMembers,
  generateSlip,
} = require("../controller/getAlreadyIssuedMemberController");
const {protected} = require('../controller/authController')
const router = express.Router();

router.route("/:itemsPerPage").get(getAlreadyIssuedMembers);
router.route("/generate-slip/:memberId").post(protected, generateSlip);
router.route("/member/:memberId").get(getAMember);

const issuedMemberRouter = router;

module.exports = issuedMemberRouter;
