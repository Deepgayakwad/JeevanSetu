const DonorProfile = require("../models/DonorProfile");
const cloudinary = require("cloudinary").v2;

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

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

    // Upload medical report if provided
    let medicalReportUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
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
    }).populate("user", "name email phone");

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

    let query = { isVerified: true, status: "active" };

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

module.exports = {
  createDonorProfile,
  getMyProfile,
  updateDonorProfile,
  searchDonors,
  getAllDonors,
};