const multer = require("multer")
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/temp/candidates')
    },
    filename: function (req, file, cb) {
        cb(null, 'candidatesPhoto.zip')
    }
})
var upload = multer({ storage: storage })
exports.uploadCandidates = upload.single('candidatePhotos')
