const Response = require('../models/Response');
const Report = require('../models/Report');

// Create a new response to a report
exports.createResponse = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { content, images } = req.body;

    // Validate required fields
    if (!content) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['content']
      });
    }

    // Check if report exists
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const response = new Response({
      report: reportId,
      user: req.user.id,
      content,
      images: images || []
    });

    await response.save();

    // Add response to report's responses array
    report.responses.push(response._id);
    await report.save();

    // Populate user details
    await response.populate('user', 'name email');

    res.status(201).json({
      message: 'Response created successfully',
      data: response
    });
  } catch (error) {
    console.error('Error creating response:', error);
    res.status(500).json({ message: 'Error creating response' });
  }
};

// Get all responses for a report
exports.getReportResponses = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { sort = 'newest' } = req.query;

    // Check if report exists
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const sortOption = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const responses = await Response.find({ report: reportId })
      .sort(sortOption)
      .populate('user', 'name email');

    res.json({ data: responses });
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ message: 'Error fetching responses' });
  }
};

// Update a response
exports.updateResponse = async (req, res) => {
  try {
    const { responseId } = req.params;
    const { content, images } = req.body;

    const response = await Response.findById(responseId);

    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    // Check if user is the response owner or an admin
    if (response.user.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this response' });
    }

    // Update fields if provided
    if (content) response.content = content;
    if (images) response.images = images;

    await response.save();

    res.json({
      message: 'Response updated successfully',
      data: response
    });
  } catch (error) {
    console.error('Error updating response:', error);
    res.status(500).json({ message: 'Error updating response' });
  }
};

// Delete a response
exports.deleteResponse = async (req, res) => {
  try {
    const { responseId } = req.params;
    const response = await Response.findById(responseId);

    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    // Check if user is the response owner or an admin
    if (response.user.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this response' });
    }

    // Remove response from report's responses array
    await Report.findByIdAndUpdate(
      response.report,
      { $pull: { responses: response._id } }
    );

    // Delete the response
    await response.remove();

    res.json({ message: 'Response deleted successfully' });
  } catch (error) {
    console.error('Error deleting response:', error);
    res.status(500).json({ message: 'Error deleting response' });
  }
}; 