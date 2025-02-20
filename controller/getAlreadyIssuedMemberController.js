// const AppError = require("../utils/AppError");
const catchAsyncError = require("../utils/catchAsyncError");
const puppeteer = require("puppeteer");
const pool = require("../utils/dbConnection");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

exports.getAlreadyIssuedMembers = catchAsyncError(async (req, res, next) => {
  const { itemsPerPage } = req.params;
  const results = await pool
    .request()
    .input("RowPerPage", itemsPerPage)
    .input("SlipStatus", "1")
    .input("PageNumber", 1)
    .output("TotalPages")
    .output("TotalDocuments")
    .output("OverallDocuments")
    .execute(`spSelectAllIssuedMember`);
  res.status(200).json({
    status: "Success",
    result: results.recordset.length,
    data: {
      issuedMembers: results.recordset.map((el) => {
        let memberImagePath;
        if (
          !fs.existsSync(
            __dirname + `/../public/images/${el.tx_org_id}.jpg`
          )
        ) {
          memberImagePath = `${req.protocol}://${req.hostname}${process.env.DEV_ENV === 'DEVELOPMENT' ? ":" + process.env.PORT : ''}/images/default_photo.png`;
        } else {
          memberImagePath = `${req.protocol}://${req.hostname}${process.env.DEV_ENV === 'DEVELOPMENT' ? ":" + process.env.PORT : ''}/images/${el.tx_org_id}.jpg`;
        }
        return {
          ...el,
          photo: memberImagePath,
        };
      }),
    },
    overAllMembers: results.output.OverallDocuments,
    totalDocuments: results.output.TotalDocuments,
  });
});

exports.getAMember = catchAsyncError(async (req, res, next) => {
  const { memberId } = req.params;
  let number;
  let pureString = "";

  function extractNumbersAndStrings(input) {
    // Regular expression to match integers and floating-point numbers (including negative numbers) with leading zeros
    const numberPattern = /-?\d+(\.\d+)?/g;

    // Extract all numbers as strings
    number =
      (input.match(numberPattern) && input.match(numberPattern)[0]) || [];

    // Remove all numbers from the string
    pureString = input.replace(numberPattern, "").replace(/\s+/g, " ").trim();
  }
  if (memberId.length < 7) {
    extractNumbersAndStrings(memberId);
  }

  const diff = 6 - memberId.length < 0 ? 0 : 6 - memberId.length;
  const blankStr = new Array(diff).fill(0).join("") || "";
  let finalString = pureString + blankStr + number;
  const counters = (await pool.request().query(`select * from T_COUNTER`))
    .recordset;

  const result = (
    await pool
      .request()
      .query(
        `select * from T_MEMBER where tx_org_id ='${memberId}' or tx_industry_name='${memberId}'`
      )
  ).recordset[0];
  if (!result) {
    return res.status(404).json({
      status: "Fail",
      message: "No member found by this id.",
    });
  }

  let memberPreviousImage;
  let memberNewImagePath;
  let memberUploadedImage;
  let memberImagePath;
  if (!fs.existsSync(__dirname + `/../public/images/${result.tx_org_id}.jpg`)) {
    memberImagePath = `${req.protocol}://${req.hostname}${process.env.DEV_ENV === 'DEVELOPMENT' ? ":" + process.env.PORT : ''}/images/default_photo.png`;
    memberPreviousImage = false;
  } else {
    memberImagePath = `${req.protocol}://${req.hostname}${process.env.DEV_ENV === 'DEVELOPMENT' ? ":" + process.env.PORT : ''}/images/${result.tx_org_id}.jpg`;
    memberPreviousImage = true;
  }
  if (
    !fs.existsSync(__dirname + `/../public/newImages/${result.tx_org_id}.jpg`)
  ) {
    memberNewImagePath = `${req.protocol}://${req.hostname}${process.env.DEV_ENV === 'DEVELOPMENT' ? ":" + process.env.PORT : ''}/images/default_photo.png`;
    memberUploadedImage = false;
  } else {
    memberNewImagePath = `${req.protocol}://${req.hostname}${process.env.DEV_ENV === 'DEVELOPMENT' ? ":" + process.env.PORT : ''}/newImages/${result.tx_org_id}.jpg`;
    memberUploadedImage = true;
  }

  res.status(200).json({
    status: "Success",
    data: {
      member: {
        ...result,
        photo: memberImagePath,
        newPhoto: memberNewImagePath,
        memberPreviousImage,
        memberUploadedImage,
        tx_counter:
          counters.find((el) => {
            if (
              parseInt(result.tx_org_sl) <= el?.ct_max &&
              parseInt(result.tx_org_sl) >= el?.ct_min
            ) {
              return true;
            }
          })?.tx_macro || "not assign yet",
      },
    },
  });
});

exports.generateSlip = catchAsyncError(async (req, res, next) => {
  const { memberId } = req.params;
  const { tx_counter } = req.body;
  if (!memberId) {
    return res.status(400).send("Member id is required.");
  }
  const result = (
    await pool
      .request()
      .query(`select * from T_MEMBER where tx_org_id ='${memberId}'`)
  ).recordset[0];

  if (!result) {
    return res.status(400).json({
      status: "Fail",
      message: "No user found with this id",
    });
  }
  if (result.is_voter_slip) {
    return res.status(400).json({
      status: "Fail",
      message: "Slip already issued.",
    });
  }
  // Create a PDF document
  const doc = new PDFDocument({
    size: [250 * 3.78, 4000], // 80mm width, height can be adjusted as needed
    margins: { top: 0, left: 0, bottom: 0, right: 0 }, // Minimal margins
  });

  // const pageWidth = doc.page.width;
  // const pageMargins = doc.page.margins;
  // const textWidth = pageWidth - pageMargins.left - pageMargins.right;

  const filePath = path.join(__dirname, `../public/pdf/${memberId}.pdf`);

  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);
  const election_info = (await pool.request().query(`select * from T_PROJECT`))
    .recordset[0];
  doc
    .font("Helvetica-Bold")
    .fontSize(55)
    .text(`OFFICE OF THE ELECTION COMMISION ${process.env.ELECTION_SESSION}`, {
      align: "center",
    });

  const logoPath = path.join(__dirname, "../public", "logo.png");
  // doc.moveDown(0.5).image(logoPath, doc.page.width / 2.5, undefined, {
  //   fit: [250, 250],
  // });
  doc
    .image(logoPath, 100, doc.y, { width: 135 })
    .text(process.env.ELECTION_NAME, doc.x + 240, doc.y + 25, {
      continued: true,
    });

  doc
    .font("Helvetica-Bold")
    .moveDown(1.5)
    .fontSize(45)
    // .text("Dhaka Club Election", { align: "center" })
    .text("VOTER SLIP", -70, undefined, { align: "center" });
  doc.rect(doc.x + 45, 225, 410, 100).stroke();

  // const imagePath = path.join(__dirname, 'controller', `images/${tx_org_id}.jpg`);
  let imagePath = path.join(__dirname, "../public/images", `${memberId}.jpg`);
  if (!fs.existsSync(path.join(imagePath))) {
    imagePath = path.join(__dirname, "../public", `default_photo.png`);
  }
  const imageWidth = 150 * 3.78;
  const docWidth = 250 * 3.78;
  const x = (docWidth - imageWidth) / 1.9 + 50;

  doc.moveDown(2).image(imagePath, x, doc.y, {
    fit: [imageWidth, imageWidth],
  });
  // Add person name
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc.moveDown();
  doc
    .moveDown(0.5)
    .fontSize(53)
    .font("Helvetica-Bold")
    .text(`${result.tx_name}`, 0, undefined, { align: "center" })
    .moveDown(0.5)
    .text(`A/C # ${result.tx_org_id}`, { align: "center" })
    .text(`SL # ${result.tx_org_sl}`, { align: "center" })
    .text(`COUNTER # ${tx_counter}`, {
      align: "center",
    });

  doc
    .moveDown(0.5)
    .fontSize(40)
    .text("ATTENTION", { align: "center" })
    .text("01. No photography inside the polling booth")
    .text("02. No use of mobile phone inside the booth");
  doc
    .font("Helvetica-Bold")
    .moveDown(1)
    .text("_____________________", {
      align: "right",
      width: doc.page.width,
      underline: true,
    })
    .text("Verified By", 610, undefined, {
      align: "left",
      width: doc.page.width,
    })
    .text("Election Commissioner", 0, undefined, {
      align: "right",
      width: doc.page.width,
    });

  // Create a Date object for the current date
  const date = new Date();

  // Extract day, month, and year
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  // Define an array with month names
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Format the date as a string
  const formattedDate = `${day}-${monthNames[month]}-${year}`;
  doc
    .moveDown()
    .fontSize(40)
    .text(
      `Print Date&Time: ${new Date().toLocaleTimeString()} | ${formattedDate}`,
      {
        align: "center",
      }
    );

  doc.end();
  res.status(201).json({
    status: "Success",
    message: "Generate Slip Successfully",
  });
});

exports.getAllMembers = catchAsyncError(async (req, res, next) => {
  const {
    tx_name,
    tx_org_id,
    tx_org_sl,
    pageNumber,
    is_voter_slip,
    showMissingPhoto,
    missingMembersPhotoId,
  } = req.body;
  let missingMembers = [];
  if (showMissingPhoto) {
    const query = `select * from T_MEMBER where ${missingMembersPhotoId
      .map((el) => `tx_org_id = '${el}'`)
      .join(" or ")}`;
    const missings = (await pool.request().query(query)).recordset;
    missingMembers = missings;
  }
  const allmembers = (
    await pool.request().query(`select tx_org_id from T_MEMBER`)
  ).recordset;
  const missingPhotoId = allmembers.filter((el) => {
    if (
      !fs.existsSync(
        path.join(__dirname, `../public/images/${el.tx_org_id}.jpg`)
      )
    ) {
      return true;
    }
  });
  const results = await pool
    .request()
    .input("RowPerPage", 8)
    .input("Tx_org_id", tx_org_id)
    .input("Tx_name", tx_name)
    .input("SlipStatus", is_voter_slip)
    .input("PageNumber", pageNumber)
    .output("OverallDocuments")
    .output("TotalDocuments")
    .output("TotalPages")
    .execute("spSelectAllMember");
  res.status(200).json({
    status: "Success",
    data: {
      members:
        missingMembers?.length === 0
          ? results.recordset.map((el) => {
            let memberImagePath;
            if (
              !fs.existsSync(
                __dirname + `/../public/images/${el.tx_org_id}.jpg`
              )
            ) {
              memberImagePath = `${req.protocol}://${req.hostname}${process.env.DEV_ENV === 'DEVELOPMENT' ? ":" + process.env.PORT : ''}/images/default_photo.png`;
            } else {
              memberImagePath = `${req.protocol}://${req.hostname}${process.env.DEV_ENV === 'DEVELOPMENT' ? ":" + process.env.PORT : ''}/images/${el.tx_org_id}.jpg`;
            }
            return {
              ...el,
              photo: memberImagePath,
            };
          })
          : missingMembers.map((el) => {
            return {
              ...el,
              photo: `${req.protocol}://${req.hostname}${process.env.DEV_ENV === 'DEVELOPMENT' ? ":" + process.env.PORT : ''}/images/default_photo.png`,
            };
          }),
    },
    missingPhotoId,
    totalDocuments: Number(results.output.TotalDocuments),
    totalPages: Number(results.output.TotalPages || 0),
  });
});

exports.setIssueTrue = catchAsyncError(async (req, res) => {
  const { memberId } = req.params;
  const currentUser = req.user;
  const pdfPath = path.join(__dirname, "../public/pdf", `${memberId}.pdf`);
  fs.unlink(pdfPath, (err) => {
    if (err) {
      return res.status(500).json({
        status: "Fail",
        message: "Failed to delete file after printing",
      });
    }
  });
  function pad(number, length) {
    return number.toString().padStart(length, "0");
  }

  function formatDate(date) {
    let year = date.getFullYear();
    let month = pad(date.getMonth() + 1, 2);
    let day = pad(date.getDate(), 2);
    let hours = pad(date.getHours(), 2);
    let minutes = pad(date.getMinutes(), 2);
    let seconds = pad(date.getSeconds(), 2);
    let milliseconds = pad(date.getMilliseconds(), 3);

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  let currentDate = new Date();
  let formattedDate = formatDate(currentDate);

  await pool
    .request()
    .query(
      `update T_MEMBER set is_voter_slip='1', dtt_voter_slip='${formattedDate}', tx_email='${currentUser.tx_name}@gmail.com' where tx_org_id='${memberId}'`
    );
  res.status(200).json({
    status: "Success",
    message: "Slip update successfully",
  });
});

exports.resetMember = catchAsyncError(async (req, res) => {
  // const { memberId } = req.params;
  console.log("Hello rahat");
  const {
    tx_name,
    tx_org_id,
    tx_org_sl,
    is_voter_slip,
    id_member_key,
    isVoterSlipIssueChange,
  } = req.body;
  console.log(req.body);
  function pad(number, length) {
    return number.toString().padStart(length, "0");
  }

  function formatDate(date) {
    let year = date.getFullYear();
    let month = pad(date.getMonth() + 1, 2); // getMonth() returns 0-11, so add 1
    let day = pad(date.getDate(), 2);
    let hours = pad(date.getHours(), 2);
    let minutes = pad(date.getMinutes(), 2);
    let seconds = pad(date.getSeconds(), 2);
    let milliseconds = pad(date.getMilliseconds(), 3);

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  let currentDate = new Date();
  let formattedDate = formatDate(currentDate);

  const result = await pool
    .request()
    .query(
      `update T_MEMBER set is_voter_slip = '${is_voter_slip === "true" ? 1 : 0
      }', ${isVoterSlipIssueChange ? `dtt_voter_slip='${formattedDate}',` : ""
      } tx_name='${tx_name}', tx_org_sl='${tx_org_sl}' where tx_org_id = '${tx_org_id}'`
    );
  res.status(200).json({
    status: "Success",
    message: "Successfully updated",
  });
});

exports.getProjectInfo = catchAsyncError(async (req, res, next) => {
  const result = (await pool.request().query(`select * from T_PROJECT`))
    .recordset[0];
  res.status(200).json({
    status: "Success",
    data: {
      project: result,
    },
  });
});

exports.updateMember = catchAsyncError(async (req, res) => {
  console.log("controller", req.file);
  console.log("Hello world");
  res.status(200).json({
    status: "Success",
    message: "Image saved Successfully",
    data: {
      image: `${req.protocol}://${req.hostname}${process.env.DEV_ENV === 'DEVELOPMENT' ? ":" + process.env.PORT : ''}/img/image1.jpeg`,
    },
  });
});
