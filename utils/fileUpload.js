const multer = require("multer");
const sharp = require('sharp')
const AppError = require("./AppError");

const catchAsyncError = require("./catchAsyncError");
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/images");
//   },
//   filename: function (req, file, cb) {
//     cb(null, `${req.body.tx_org_id}.jpg`);
//   },
// });

// const upload = multer({ storage: storage });
// const uploadSingle = upload.single("image");

// module.exports = uploadSingle;

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  console.log('files', req.file)
  console.log(req.body)
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadSingle = upload.single("image");

exports.resizeUploadedImage = catchAsyncError(async (req, res, next) => {
  if(!req.file) return 

  req.body.image = `${req.body.tx_org_id}.jpg`;
  await sharp(req.file.buffer)
    // .resize(132, 170)
    .resize(500, 600)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/newImages/${req.body.image}`);

  // // 2) Images
  // req.body.images = [];

  // await Promise.all(
  //   req.files.images.map(async (file, i) => {
  //     const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

  //     await sharp(file.buffer)
  //       .resize(2000, 1333)
  //       .toFormat("jpeg")
  //       .jpeg({ quality: 90 })
  //       .toFile(`public/img/tours/${filename}`);

  //     req.body.images.push(filename);
  //   })
  // );

  next();
});
