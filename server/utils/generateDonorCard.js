const PDFDocument = require("pdfkit");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

/**
 * Generate a digital Donor Card PDF and upload it to Cloudinary.
 * Returns the Cloudinary secure URL of the uploaded PDF.
 *
 * @param {Object} donorData
 * @param {string} donorData.name
 * @param {string} donorData.bloodGroup
 * @param {string[]} donorData.organs
 * @param {string} donorData.city
 * @param {string} donorData.state
 * @param {string} donorData.donorId  — MongoDB _id as string
 * @param {string} donorData.pledgeDate
 */
const generateDonorCard = (donorData) => {
  return new Promise((resolve, reject) => {
    const { name, bloodGroup, organs, city, state, donorId, pledgeDate } = donorData;

    const doc = new PDFDocument({
      size: [595, 340], // landscape credit-card-ish proportions
      margins: { top: 30, bottom: 30, left: 40, right: 40 },
    });

    // ── Collect PDF buffer ────────────────────────────────────────────────────
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);

      try {
        // Upload buffer to Cloudinary
        const uploadResult = await new Promise((res, rej) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "jeevansetu/donor_cards",
              resource_type: "raw",
              format: "pdf",
              public_id: `donor_card_${donorId}`,
              overwrite: true,
            },
            (error, result) => {
              if (error) rej(error);
              else res(result);
            }
          );

          const readable = Readable.from(pdfBuffer);
          readable.pipe(uploadStream);
        });

        resolve(uploadResult.secure_url);
      } catch (err) {
        reject(err);
      }
    });

    doc.on("error", reject);

    // ── Design ────────────────────────────────────────────────────────────────

    // Background gradient-like: dark teal header bar
    doc.rect(0, 0, 595, 100).fill("#0f4c75");

    // JeevanSetu logo text
    doc
      .fillColor("#ffffff")
      .fontSize(26)
      .font("Helvetica-Bold")
      .text("JeevanSetu", 40, 28);

    doc
      .fillColor("#1be7ff")
      .fontSize(11)
      .font("Helvetica")
      .text("Bridge of Life — Digital Donor Card", 40, 60);

    // Heart symbol area (right side of header)
    doc.fillColor("#e74c3c").fontSize(48).text("♥", 510, 30, { width: 50 });

    // ── Body section ─────────────────────────────────────────────────────────
    doc.fillColor("#0f4c75").rect(0, 100, 595, 3).fill();

    // Left column — donor info
    const bodyTop = 120;
    doc.fillColor("#333333").fontSize(13).font("Helvetica-Bold").text("Donor Name:", 40, bodyTop);
    doc.fillColor("#0f4c75").fontSize(16).font("Helvetica-Bold").text(name, 40, bodyTop + 18);

    doc.fillColor("#333333").fontSize(11).font("Helvetica-Bold").text("Blood Group:", 40, bodyTop + 50);
    doc
      .fillColor("#e74c3c")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text(bloodGroup, 40, bodyTop + 65);

    // Right column — organs
    doc.fillColor("#333333").fontSize(11).font("Helvetica-Bold").text("Organs Pledged:", 230, bodyTop);
    doc
      .fillColor("#0f4c75")
      .fontSize(12)
      .font("Helvetica")
      .text(organs.map((o) => `• ${o.charAt(0).toUpperCase() + o.slice(1)}`).join("\n"), 230, bodyTop + 18, {
        lineGap: 3,
      });

    // Location
    doc.fillColor("#333333").fontSize(11).font("Helvetica-Bold").text("Location:", 420, bodyTop);
    doc
      .fillColor("#555555")
      .fontSize(11)
      .font("Helvetica")
      .text(`${city}, ${state}`, 420, bodyTop + 18);

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.rect(0, 270, 595, 70).fill("#f4f6f8");
    doc
      .fillColor("#888888")
      .fontSize(9)
      .font("Helvetica")
      .text(`Donor ID: ${donorId}`, 40, 282)
      .text(`Pledge Date: ${new Date(pledgeDate || Date.now()).toLocaleDateString("en-IN")}`, 40, 298)
      .text(
        "This card is digitally issued by JeevanSetu. For verification visit jeevansetu.in",
        40,
        314,
        { width: 520 }
      );

    // Separator line before footer
    doc.rect(0, 268, 595, 2).fill("#cccccc");

    doc.end();
  });
};

module.exports = generateDonorCard;
