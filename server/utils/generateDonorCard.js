const PDFDocument = require("pdfkit");
const { Readable } = require("stream");

/**
 * Generate a digital Donor Card PDF and pipe it to a writable stream.
 */
const generateDonorCard = (donorData, writeStream) => {
  return new Promise((resolve, reject) => {
    const { name, bloodGroup, organs, city, state, donorId, pledgeDate, verifiedByHospitalName } = donorData;

    const doc = new PDFDocument({
      size: [595, 340], // landscape credit-card-ish proportions
      margins: { top: 30, bottom: 30, left: 40, right: 40 },
    });

    doc.pipe(writeStream);

    doc.on("end", resolve);
    doc.on("error", reject);

    // Background gradient-like: dark teal header bar
    doc.rect(0, 0, 595, 100).fill("#0f4c75");

    // JeevanSetu logo text
    doc.fillColor("#ffffff").fontSize(26).font("Helvetica-Bold").text("JeevanSetu", 40, 28);
    doc.fillColor("#1be7ff").fontSize(11).font("Helvetica").text("Bridge of Life — Digital Donor Card", 40, 60);

    // Heart symbol area (right side of header)
    doc.fillColor("#e74c3c").fontSize(48).text("♥", 510, 30, { width: 50 });

    // Body section
    doc.fillColor("#0f4c75").rect(0, 100, 595, 3).fill();

    const bodyTop = 120;
    doc.fillColor("#333333").fontSize(13).font("Helvetica-Bold").text("Donor Name:", 40, bodyTop);
    doc.fillColor("#0f4c75").fontSize(16).font("Helvetica-Bold").text(name, 40, bodyTop + 18);

    doc.fillColor("#333333").fontSize(11).font("Helvetica-Bold").text("Blood Group:", 40, bodyTop + 50);
    doc.fillColor("#e74c3c").fontSize(22).font("Helvetica-Bold").text(bloodGroup, 40, bodyTop + 65);

    // Right column — organs
    doc.fillColor("#333333").fontSize(11).font("Helvetica-Bold").text("Organs Pledged:", 230, bodyTop);
    doc.fillColor("#0f4c75").fontSize(12).font("Helvetica")
       .text(organs.map((o) => `• ${o.charAt(0).toUpperCase() + o.slice(1)}`).join("\n"), 230, bodyTop + 18, { lineGap: 3 });

    // Location
    doc.fillColor("#333333").fontSize(11).font("Helvetica-Bold").text("Location:", 420, bodyTop);
    doc.fillColor("#555555").fontSize(11).font("Helvetica").text(`${city}, ${state}`, 420, bodyTop + 18);

    // Footer
    doc.rect(0, 270, 595, 70).fill("#f4f6f8");
    doc.fillColor("#888888").fontSize(9).font("Helvetica")
      .text(`Donor ID: ${donorId}`, 40, 282)
      .text(`Pledge Date: ${new Date(pledgeDate || Date.now()).toLocaleDateString("en-IN")}`, 40, 298)
      .text("This card is digitally issued by JeevanSetu. For verification visit jeevansetu.in", 40, 314, { width: 520 });

    // Separator line before footer
    doc.rect(0, 268, 595, 2).fill("#cccccc");

    // Verification Stamp
    if (verifiedByHospitalName) {
      doc.save();
      // Position the stamp on the right side
      doc.translate(480, 290);
      // Create a green circle stamp
      doc.circle(0, 0, 24).lineWidth(2).stroke("#10b981");
      doc.circle(0, 0, 20).lineWidth(1).stroke("#10b981");
      doc.fillColor("#10b981").fontSize(7).font("Helvetica-Bold")
         .text("VERIFIED", -18, -10, { width: 36, align: "center" })
         .fontSize(5)
         .text("BY", -18, -1, { width: 36, align: "center" })
         .text(verifiedByHospitalName.slice(0, 10).toUpperCase(), -20, 6, { width: 40, align: "center" });
      doc.restore();
    }

    doc.end();
  });
};

module.exports = generateDonorCard;
