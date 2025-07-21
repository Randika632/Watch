const Report = require('../models/Report');
const Response = require('../models/Response');

// Create a new report
exports.createReport = async (req, res) => {
  try {
    console.log('=== CREATE REPORT REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('User ID:', req.user.id);
    
    const { title, name, age, lastSeen, contactNumber, description, location, category, images } = req.body;

    console.log('Extracted fields:', {
      title, name, age, lastSeen, contactNumber, description, location, category, images
    });

    // Validate required fields
    if (!description || !location) {
      console.log('Validation failed - missing required fields');
      console.log('Description exists:', !!description);
      console.log('Location exists:', !!location);
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['description', 'location'],
        received: { description: !!description, location: !!location }
      });
    }

    const report = new Report({
      user: req.user.id,
      title,
      name,
      age,
      lastSeen,
      contactNumber,
      description,
      location,
      category: category || 'Missing Person',
      images: images || []
    });

    await report.save();

    // Populate user details
    await report.populate('user', 'name email');

    res.status(201).json({
      message: 'Report created successfully',
      data: report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'Error creating report' });
  }
};

// Get all reports with optional filtering
exports.getAllReports = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    let query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by category if provided
    if (category) {
      query.category = category;
    }

    // Search by title or description if search term provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate({
        path: 'responses',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    res.json({ data: reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
};

// Get only active reports for community view
exports.getActiveReports = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { status: 'Active' }; // Only active reports

    // Filter by category if provided
    if (category) {
      query.category = category;
    }

    // Search by title or description if search term provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate({
        path: 'responses',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    res.json({ data: reports });
  } catch (error) {
    console.error('Error fetching active reports:', error);
    res.status(500).json({ message: 'Error fetching active reports' });
  }
};

// Get a single report with its responses
exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('user', 'name email')
      .populate({
        path: 'responses',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ data: report });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'Error fetching report' });
  }
};

// Update a report
exports.updateReport = async (req, res) => {
  try {
    const { title, name, age, lastSeen, contactNumber, description, location, category, status, images } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user is the report owner or an admin
    if (report.user.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this report' });
    }

    // Update fields if provided
    if (title) report.title = title;
    if (name) report.name = name;
    if (age) report.age = age;
    if (lastSeen) report.lastSeen = lastSeen;
    if (contactNumber) report.contactNumber = contactNumber;
    if (description) report.description = description;
    if (location) report.location = location;
    if (category) report.category = category;
    if (status) report.status = status;
    if (images) report.images = images;

    await report.save();

    res.json({
      message: 'Report updated successfully',
      data: report
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Error updating report' });
  }
};

// Delete a report and its responses
exports.deleteReport = async (req, res) => {
  try {
    console.log('=== DELETE REPORT REQUEST ===');
    console.log('Report ID:', req.params.id);
    console.log('User ID:', req.user.id);
    
    // Validate report ID
    if (!req.params.id || !req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid report ID format');
      return res.status(400).json({ message: 'Invalid report ID' });
    }
    
    const report = await Report.findById(req.params.id);

    if (!report) {
      console.log('Report not found');
      return res.status(404).json({ message: 'Report not found' });
    }

    console.log('Found report:', {
      id: report._id,
      user: report.user,
      title: report.name
    });

    // Check if user is the report owner or an admin
    if (report.user.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      console.log('User not authorized to delete this report');
      return res.status(403).json({ message: 'Not authorized to delete this report' });
    }

    console.log('User authorized, proceeding with deletion');

    // Delete all responses associated with this report
    const deletedResponses = await Response.deleteMany({ report: report._id });
    console.log('Deleted responses count:', deletedResponses.deletedCount);

    // Delete the report
    const deletedReport = await Report.deleteOne({ _id: report._id });
    console.log('Deleted report result:', deletedReport);

    if (deletedReport.deletedCount === 0) {
      console.log('Report was not deleted');
      return res.status(500).json({ message: 'Failed to delete report' });
    }

    console.log('Report deleted successfully');
    res.json({ message: 'Report and associated responses deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: 'Error deleting report', error: error.message });
  }
}; 