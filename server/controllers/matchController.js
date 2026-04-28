const Match = require("../models/Match");
const DonorProfile = require("../models/DonorProfile");
const RecipientRequest = require("../models/RecipientRequest");
const { createAndEmitNotification } = require("./notificationController");

// ── Blood group compatibility map ─────────────────────────────────────────────
// Key can donate to all values in its array
const bloodCompatibility = {
  "O-":  ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+":  ["O+", "A+", "B+", "AB+"],
  "A-":  ["A-", "A+", "AB-", "AB+"],
  "A+":  ["A+", "AB+"],
  "B-":  ["B-", "B+", "AB-", "AB+"],
  "B+":  ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

// Returns true if donorBlood can donate to recipientBlood
const isBloodCompatible = (donorBlood, recipientBlood) => {
  return bloodCompatibility[donorBlood]?.includes(recipientBlood) ?? false;
};

// Score a donor match (higher = better)
const scoreDonor = (donor, request) => {
  let score = 0;

  // Exact blood group match
  if (donor.bloodGroup === request.bloodGroup) score += 100;
  else if (isBloodCompatible(donor.bloodGroup, request.bloodGroup)) score += 60;

  // Location scoring
  if (
    donor.city &&
    request.city &&
    donor.city.toLowerCase() === request.city.toLowerCase()
  ) score += 50;

  if (
    donor.state &&
    request.state &&
    donor.state.toLowerCase() === request.state.toLowerCase()
  ) score += 30;

  // Urgency boost for critical requests
  if (request.urgencyLevel === "critical") score += 20;

  return score;
};

// @route GET /api/match/suggestions/:recipientRequestId
// @desc  Get scored + ranked matching donors for a recipient request
// @access Admin, Hospital
const getMatchSuggestions = async (req, res) => {
  try {
    const request = await RecipientRequest.findById(
      req.params.recipientRequestId
    );

    if (!request) {
      return res.status(404).json({ message: "Recipient request not found" });
    }

    // Find ALL verified active donors with the required organ
    const candidateDonors = await DonorProfile.find({
      organs: { $in: [request.organNeeded] },
      status: "active",
      isVerified: true,
    }).populate("user", "name email phone");

    // Filter by blood compatibility + score
    const compatibleDonors = candidateDonors
      .filter((donor) =>
        donor.bloodGroup === request.bloodGroup ||
        isBloodCompatible(donor.bloodGroup, request.bloodGroup)
      )
      .map((donor) => ({
        ...donor.toObject(),
        matchScore: scoreDonor(donor, request),
        isExactBloodMatch: donor.bloodGroup === request.bloodGroup,
      }))
      .sort((a, b) => b.matchScore - a.matchScore); // Best match first

    res.json({
      recipientRequest: request,
      matchingDonors: compatibleDonors,
      totalMatches: compatibleDonors.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/match/confirm
// @desc  Admin/Hospital confirms a donor-recipient match
// @access Admin, Hospital
const confirmMatch = async (req, res) => {
  try {
    const {
      donorId,
      recipientId,
      donorProfileId,
      recipientRequestId,
      organ,
      hospital,
      notes,
    } = req.body;

    // Check if match already exists
    const existingMatch = await Match.findOne({
      donorProfile: donorProfileId,
      recipientRequest: recipientRequestId,
    });

    if (existingMatch) {
      return res.status(400).json({ message: "Match already exists" });
    }

    // Create match
    const match = await Match.create({
      donor: donorId,
      recipient: recipientId,
      donorProfile: donorProfileId,
      recipientRequest: recipientRequestId,
      organ,
      hospital,
      matchedBy: req.user.role === "admin" ? "admin" : "system",
      notes,
    });

    // Update donor and recipient statuses
    await DonorProfile.findByIdAndUpdate(donorProfileId, { status: "inactive" });
    await RecipientRequest.findByIdAndUpdate(recipientRequestId, { status: "matched" });

    // Populate match details
    const populatedMatch = await Match.findById(match._id)
      .populate("donor", "name email phone")
      .populate("recipient", "name email phone")
      .populate("donorProfile")
      .populate("recipientRequest");

    // Real-time notifications to both donor and recipient
    const io = req.app.get("io");

    await createAndEmitNotification(io, {
      userId: donorId,
      type: "match",
      title: "🎉 You've Been Matched!",
      message: `You have been matched with a recipient needing a ${organ}. Hospital: ${hospital}`,
      relatedId: match._id,
    });

    await createAndEmitNotification(io, {
      userId: recipientId,
      type: "match",
      title: "🎉 Organ Match Found!",
      message: `Great news! A donor has been matched for your ${organ} request at ${hospital}.`,
      relatedId: match._id,
    });

    res.status(201).json(populatedMatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/match/history
// @desc  Get all matches (admin)
// @access Admin only
const getMatchHistory = async (req, res) => {
  try {
    const matches = await Match.find()
      .populate("donor", "name email")
      .populate("recipient", "name email")
      .populate("donorProfile", "bloodGroup organs city state")
      .sort({ createdAt: -1 });

    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/match/mymatches
// @desc  Get my matches (donor or recipient)
// @access Protected
const getMyMatches = async (req, res) => {
  try {
    let matches;

    if (req.user.role === "donor") {
      matches = await Match.find({ donor: req.user._id })
        .populate("recipient", "name email phone")
        .populate("recipientRequest")
        .sort({ createdAt: -1 });
    } else if (req.user.role === "recipient") {
      matches = await Match.find({ recipient: req.user._id })
        .populate("donor", "name email phone")
        .populate("donorProfile")
        .sort({ createdAt: -1 });
    } else {
      // Hospital or admin: all matches
      matches = await Match.find()
        .populate("donor", "name email")
        .populate("recipient", "name email")
        .sort({ createdAt: -1 });
    }

    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PATCH /api/match/:id/status
// @desc  Update match status
// @access Admin, Hospital
const updateMatchStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate("donor", "name email")
      .populate("recipient", "name email");

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    res.json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMatchSuggestions,
  confirmMatch,
  getMatchHistory,
  getMyMatches,
  updateMatchStatus,
};