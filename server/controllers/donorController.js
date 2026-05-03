const DonorProfile = require("../models/DonorProfile");
const generateDonorCard = require("../utils/generateDonorCard");
const { uploadToCloudinary } = require("../middleware/uploadMiddleware");

// @route POST /api/donor/profile
// @desc Create donor profile
const createDonorProfile = async (req, res) => {
  try {
    const { organs, bloodGroup, age, city, state } = req.body;

    // Check if profile already exists
    const existing = await DonorProfile.findOne({ user: req.user._id });
    if (existing) {
      return res.status(400).json({ message: "Donor profile already exists" });
    }

    // Upload medical report to Cloudinary if provided
    let medicalReportUrl = "";
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: "jeevansetu/medical-reports",
        resource_type: "auto",
      });
      medicalReportUrl = result.secure_url;
    }

    const profile = await DonorProfile.create({
      user: req.user._id,
      organs,
      bloodGroup,
      age,
      city,
      state,
      medicalReport: medicalReportUrl,
    });

    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/donor/profile
// @desc Get my donor profile
const getMyProfile = async (req, res) => {
  try {
    const profile = await DonorProfile.findOne({
      user: req.user._id,
    })
      .populate("user", "name email phone")
      .populate("verifiedByHospital", "name");

    if (!profile) {
      return res.status(404).json({ message: "Donor profile not found" });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/donor/profile
// @desc Update donor profile
const updateDonorProfile = async (req, res) => {
  try {
    const profile = await DonorProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ message: "Donor profile not found" });
    }

    const updated = await DonorProfile.findOneAndUpdate(
      { user: req.user._id },
      { ...req.body },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/donor/search
// @desc Search donors by organ, blood group, city
const searchDonors = async (req, res) => {
  try {
    const { organ, bloodGroup, city, state } = req.query;

    // Only return verified donors for recipients
    let query = { status: "active", isVerified: true };

    if (organ) query.organs = { $in: [organ] };
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (city) query.city = new RegExp(city, "i");
    if (state) query.state = new RegExp(state, "i");

    const donors = await DonorProfile.find(query).populate(
      "user",
      "name email phone"
    );

    res.json(donors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/donor/all
// @desc Get all donors (admin only)
const getAllDonors = async (req, res) => {
  try {
    const donors = await DonorProfile.find().populate(
      "user",
      "name email phone"
    );
    res.json(donors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/donor/card
// @desc  Generate PDF Donor Card and stream it directly
// @access Donor only
const getDonorCard = async (req, res) => {
  try {
    const profile = await DonorProfile.findOne({ user: req.user._id })
      .populate("user", "name")
      .populate("verifiedByHospital", "name");

    if (!profile) {
      return res.status(404).json({ message: "Donor profile not found. Create your profile first." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=donor_card_${profile._id}.pdf`);

    // Generate new donor card PDF and pipe to response
    await generateDonorCard({
      name: profile.user.name,
      bloodGroup: profile.bloodGroup,
      organs: profile.organs,
      city: profile.city,
      state: profile.state,
      donorId: profile._id.toString(),
      pledgeDate: profile.pledgeDate || profile.createdAt,
      verifiedByHospitalName: profile.isVerified && profile.verifiedByHospital ? profile.verifiedByHospital.name : null,
    }, res);

  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    }
  }
};

// @route GET /api/donor/:id/card
// @desc  Generate donor card for a specific donor profile and stream it
// @access Any authenticated user
const getDonorCardById = async (req, res) => {
  try {
    const profile = await DonorProfile.findById(req.params.id)
      .populate("user", "name")
      .populate("verifiedByHospital", "name");

    if (!profile) {
      return res.status(404).json({ message: "Donor profile not found." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=donor_card_${profile._id}.pdf`);

    // Generate new donor card PDF and pipe to response
    await generateDonorCard({
      name: profile.user.name,
      bloodGroup: profile.bloodGroup,
      organs: profile.organs,
      city: profile.city,
      state: profile.state,
      donorId: profile._id.toString(),
      pledgeDate: profile.pledgeDate || profile.createdAt,
      verifiedByHospitalName: profile.isVerified && profile.verifiedByHospital ? profile.verifiedByHospital.name : null,
    }, res);

  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    }
  }
};

// @route DELETE /api/donor/profile
// @desc  Delete donor profile (withdraw pledge)
// @access Donor only
const deleteDonorProfile = async (req, res) => {
  try {
    const profile = await DonorProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ message: "Donor profile not found" });
    }

    if (profile.isVerified) {
      return res.status(400).json({ message: "Cannot withdraw pledge after verification. Please contact an admin." });
    }

    await DonorProfile.deleteOne({ user: req.user._id });
    res.json({ message: "Donor profile deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PATCH /api/donor/request-verification/:hospitalId
// @desc  Request verification from a specific hospital
// @access Donor only
const requestVerification = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    
    const profile = await DonorProfile.findOneAndUpdate(
      { user: req.user._id },
      { verificationRequestedFrom: hospitalId },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Donor profile not found" });
    }

    // Optional: Notify the hospital via socket
    const io = req.app.get("io");
    if (io) {
      const { createAndEmitNotification } = require("./notificationController");
      await createAndEmitNotification(io, {
        userId: hospitalId,
        type: "verify",
        title: "New Verification Request",
        message: `${req.user.name} has requested profile verification.`,
        relatedId: profile._id,
      });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createDonorProfile,
  getMyProfile,
  updateDonorProfile,
  searchDonors,
  getAllDonors,
  getDonorCard,
  getDonorCardById,
  deleteDonorProfile,
  requestVerification,
};