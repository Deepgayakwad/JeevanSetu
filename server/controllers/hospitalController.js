const DonorProfile = require("../models/DonorProfile");
const Match = require("../models/Match");
const User = require("../models/User");
const { createAndEmitNotification } = require("./notificationController");

// @route PATCH /api/hospital/verify/:donorProfileId
// @desc  Verify a donor profile (hospital/admin only)
// @access Hospital, Admin
const verifyDonor = async (req, res) => {
  try {
    const donorProfile = await DonorProfile.findByIdAndUpdate(
      req.params.donorProfileId,
      { isVerified: true },
      { new: true }
    ).populate("user", "name email");

    if (!donorProfile) {
      return res.status(404).json({ message: "Donor profile not found" });
    }

    // Notify the donor
    const io = req.app.get("io");
    await createAndEmitNotification(io, {
      userId: donorProfile.user._id,
      type: "verify",
      title: "Profile Verified ✅",
      message:
        "Congratulations! Your donor profile has been verified. You are now visible to recipients.",
      relatedId: donorProfile._id,
    });

    res.json({ message: "Donor verified successfully", donorProfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/hospital/dashboard
// @desc  Hospital dashboard stats
// @access Hospital, Admin
const getHospitalDashboard = async (req, res) => {
  try {
    const pendingVerifications = await DonorProfile.find({ isVerified: false })
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    const recentMatches = await Match.find({ hospital: req.user.name })
      .populate("donor", "name email")
      .populate("recipient", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    const totalVerified = await DonorProfile.countDocuments({ isVerified: true });
    const totalPending = await DonorProfile.countDocuments({ isVerified: false });

    res.json({
      stats: { totalVerified, totalPending },
      pendingVerifications,
      recentMatches,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PATCH /api/hospital/transplant/:matchId
// @desc  Update transplant status for a match
// @access Hospital, Admin
const updateTransplantStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const allowedStatuses = ["proposed", "confirmed", "completed", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const match = await Match.findByIdAndUpdate(
      req.params.matchId,
      { status, notes },
      { new: true }
    )
      .populate("donor", "name email")
      .populate("recipient", "name email");

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    // Notify both donor and recipient
    const io = req.app.get("io");
    const statusMessages = {
      confirmed: "Your organ match has been confirmed by the hospital! 🎉",
      completed: "The organ transplant has been completed successfully. 💙",
      cancelled: "Unfortunately, your match has been cancelled. Please contact the hospital.",
    };

    if (statusMessages[status]) {
      await createAndEmitNotification(io, {
        userId: match.donor._id,
        type: "match",
        title: `Match Status Updated`,
        message: statusMessages[status],
        relatedId: match._id,
      });
      await createAndEmitNotification(io, {
        userId: match.recipient._id,
        type: "match",
        title: `Match Status Updated`,
        message: statusMessages[status],
        relatedId: match._id,
      });
    }

    res.json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/hospital/unverified
// @desc  Get all unverified donor profiles
// @access Hospital, Admin
const getUnverifiedDonors = async (req, res) => {
  try {
    const donors = await DonorProfile.find({ isVerified: false })
      .populate("user", "name email phone profilePic")
      .sort({ createdAt: -1 });

    res.json(donors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  verifyDonor,
  getHospitalDashboard,
  updateTransplantStatus,
  getUnverifiedDonors,
};
