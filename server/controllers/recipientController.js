const RecipientRequest = require("../models/RecipientRequest");

// @route POST /api/recipient/request
// @desc Create recipient request
const createRequest = async (req, res) => {
  try {
    const {
      organNeeded,
      bloodGroup,
      urgencyLevel,
      hospital,
      city,
      state,
      doctorNote,
      additionalInfo,
    } = req.body;

    const request = await RecipientRequest.create({
      user: req.user._id,
      organNeeded,
      bloodGroup,
      urgencyLevel,
      hospital,
      city,
      state,
      doctorNote,
      additionalInfo,
    });

    // 🚨 SOS: Broadcast emergency alert to all admins/hospitals via Socket.io
    if (urgencyLevel === "critical") {
      const io = req.app.get("io");
      if (io) {
        io.emit("sos:alert", {
          message: `🚨 CRITICAL ORGAN REQUEST: ${organNeeded} (${bloodGroup}) needed urgently in ${city}, ${state}`,
          request,
          requestedBy: req.user._id,
        });
      }
    }

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/recipient/requests
// @desc Get all open requests
const getAllRequests = async (req, res) => {
  try {
    const { organ, city, urgencyLevel } = req.query;

    let query = { status: "waiting" };

    if (organ) query.organNeeded = organ;
    if (city) query.city = new RegExp(city, "i");
    if (urgencyLevel) query.urgencyLevel = urgencyLevel;

    const requests = await RecipientRequest.find(query)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/recipient/myrequests
// @desc Get my requests
const getMyRequests = async (req, res) => {
  try {
    const requests = await RecipientRequest.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/recipient/request/:id
// @desc Get single request
const getRequestById = async (req, res) => {
  try {
    const request = await RecipientRequest.findById(req.params.id).populate(
      "user",
      "name email phone"
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/recipient/request/:id
// @desc Update request status
const updateRequest = async (req, res) => {
  try {
    const request = await RecipientRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Only owner or admin can update
    if (
      request.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updated = await RecipientRequest.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/recipient/request/:id
// @desc Delete request
const deleteRequest = async (req, res) => {
  try {
    const request = await RecipientRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Only owner or admin can delete
    if (
      request.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await RecipientRequest.findByIdAndDelete(req.params.id);
    res.json({ message: "Request deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  getMyRequests,
  getRequestById,
  updateRequest,
  deleteRequest,
};