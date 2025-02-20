const catchAsyncError = require("../utils/catchAsyncError");
const fs = require('fs')
const unzipper = require('unzipper')
const path = require('path');

exports.uploadCandidatePhotos = catchAsyncError(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            status: 'Fail',
            message: 'No file uploaded',
        });
    }

    const zipFilePath = req.file.path; // Get uploaded file path
    const outputDir = path.join(__dirname, '../public/images');

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Unzip and extract files
    fs.createReadStream(zipFilePath)
        .pipe(unzipper.Extract({ path: outputDir }))
        .on('close', () => {
            res.status(200).json({
                status: 'Success',
                message: 'Candidates Photos Uploaded Successfully',
            });
        })
        .on('error', (err) => {
            console.error('Unzip Error:', err);
            res.status(500).json({
                status: 'Error',
                message: 'Error extracting zip file',
            });
        });
});
