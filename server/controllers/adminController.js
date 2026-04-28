const User = require("../models/User");
const DonorProfile = require("../models/DonorProfile");
const RecipientRequest = require("../models/RecipientRequest");
const Match = require("../models/Match");

// @route GET /api/admin/stats
// @desc  Get platform-wide statistics
// @access Admin only
const getPlatformStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalDonors,
      totalRecipients,
      totalHospitals,
      totalMatches,
      completedMatches,
      pendingRequests,
      verifiedDonors,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "donor" }),
      User.countDocuments({ role: "recipient" }),
      User.countDocuments({ role: "hospital" }),
      Match.countDocuments(),
      Match.countDocuments({ status: "completed" }),
      RecipientRequest.countDocuments({ status: "waiting" }),
      DonorProfile.countDocuments({ isVerified: true }),
    ]);

    // Monthly match trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyMatches = await Match.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      totalUsers,
      totalDonors,
      totalRecipients,
      totalHospitals,
      totalMatches,
      completedMatches,
      pendingRequests,
      verifiedDonors,
      monthlyMatches,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/admin/users
// @desc  Get all users with pagination
// @access Admin only
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const role = req.query.role;
    const search = req.query.search;

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PATCH /api/admin/ban/:userId
// @desc  Toggle ban (isVerified = false) on a user
// @access Admin only
const banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot ban an admin user" });
    }

    user.isVerified = !user.isVerified;
    await user.save();

    res.json({
      message: user.isVerified ? "User unbanned" : "User banned",
      isVerified: user.isVerified,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/admin/user/:userId
// @desc  Permanently delete a user and all related data
// @access Admin only
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot delete an admin user" });
    }

    // Cascade delete related data
    await DonorProfile.deleteOne({ user: user._id });
    await RecipientRequest.deleteMany({ user: user._id });
    await Match.deleteMany({
      $or: [{ donor: user._id }, { recipient: user._id }],
    });
    await User.findByIdAndDelete(user._id);

    res.json({ message: "User and all related data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/admin/user/:userId
// @desc  Get a single user's full profile
// @access Admin only
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const donorProfile = await DonorProfile.findOne({ user: user._id });
    const recipientRequests = await RecipientRequest.find({ user: user._id });
    const matches = await Match.find({
      $or: [{ donor: user._id }, { recipient: user._id }],
    });

    res.json({ user, donorProfile, recipientRequests, matches });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPlatformStats,
  getAllUsers,
  banUser,
  deleteUser,
  getUserById,
};
