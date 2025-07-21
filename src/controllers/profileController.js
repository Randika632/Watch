const User = require('../models/User');
const Report = require('../models/Report');
const Response = require('../models/Response');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    console.log('Profile request - User ID from token:', req.user.id);
    console.log('Profile request - Full user object:', req.user);
    
    const user = await User.findById(req.user.id)
      .select('-password -__v')
      .lean();

    console.log('Profile request - Found user:', user ? 'Yes' : 'No');
    if (user) {
      console.log('Profile request - User email:', user.email);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ data: user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const {
      name,
      age,
      height,
      weight,
      mobile,
      gender,
      bloodType,
      medicalConditions,
      allergies,
      medications,
      profileImage
    } = req.body;

    const updateData = {};
    const validationErrors = [];

    // Validate and add fields if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        validationErrors.push('Name must be a non-empty string');
      } else {
        updateData.name = name.trim();
      }
    }

    if (age !== undefined) {
      const ageNum = Number(age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        validationErrors.push('Age must be a number between 1 and 120');
      } else {
        updateData.age = ageNum;
      }
    }

    if (height !== undefined) {
      const heightNum = Number(height);
      if (isNaN(heightNum) || heightNum < 30 || heightNum > 300) {
        validationErrors.push('Height must be a number between 30 and 300 cm');
      } else {
        updateData.height = heightNum;
      }
    }

    if (weight !== undefined) {
      const weightNum = Number(weight);
      if (isNaN(weightNum) || weightNum < 20 || weightNum > 300) {
        validationErrors.push('Weight must be a number between 20 and 300 kg');
      } else {
        updateData.weight = weightNum;
      }
    }

    if (mobile !== undefined) {
      const mobileStr = mobile.toString().replace(/\D/g, '');
      if (mobileStr.length !== 10) {
        validationErrors.push('Mobile number must be 10 digits');
      } else {
        updateData.mobile = mobileStr;
      }
    }

    if (gender !== undefined) {
      const validGenders = ['Male', 'Female', 'Other', 'Prefer not to say'];
      if (!validGenders.includes(gender)) {
        validationErrors.push('Invalid gender selection');
      } else {
        updateData.gender = gender;
      }
    }

    if (bloodType !== undefined) {
      const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      if (!validBloodTypes.includes(bloodType)) {
        validationErrors.push('Invalid blood type');
      } else {
        updateData.bloodType = bloodType;
      }
    }

    if (profileImage !== undefined) {
      if (typeof profileImage !== 'string' || profileImage.trim().length === 0) {
        validationErrors.push('Profile image must be a valid URL');
      } else {
        updateData.profileImage = profileImage.trim();
      }
    }

    // Handle arrays with validation
    if (medicalConditions !== undefined) {
      if (!Array.isArray(medicalConditions)) {
        validationErrors.push('Medical conditions must be an array');
      } else {
        updateData.medicalConditions = medicalConditions.filter(condition => 
          typeof condition === 'string' && condition.trim().length > 0
        );
      }
    }

    if (allergies !== undefined) {
      if (!Array.isArray(allergies)) {
        validationErrors.push('Allergies must be an array');
      } else {
        updateData.allergies = allergies.filter(allergy => 
          typeof allergy === 'string' && allergy.trim().length > 0
        );
      }
    }

    if (medications !== undefined) {
      if (!Array.isArray(medications)) {
        validationErrors.push('Medications must be an array');
      } else {
        updateData.medications = medications.filter(medication => 
          typeof medication === 'string' && medication.trim().length > 0
        );
      }
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// Upload profile image
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { profileImage: imageUrl } },
      { new: true }
    ).select('-password -__v');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile image uploaded successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ message: 'Error uploading profile image' });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get counts of user's reports and responses
    const [reportsCount, responsesCount] = await Promise.all([
      Report.countDocuments({ reporter: userId }),
      Response.countDocuments({ responder: userId })
    ]);

    // Get recent activity count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentReports, recentResponses] = await Promise.all([
      Report.countDocuments({ 
        reporter: userId, 
        createdAt: { $gte: thirtyDaysAgo } 
      }),
      Response.countDocuments({ 
        responder: userId, 
        createdAt: { $gte: thirtyDaysAgo } 
      })
    ]);

    const stats = {
      totalReports: reportsCount,
      totalResponses: responsesCount,
      recentReports: recentReports,
      recentResponses: recentResponses,
      totalActivity: reportsCount + responsesCount,
      recentActivity: recentReports + recentResponses
    };

    res.json({ data: stats });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Error fetching user statistics' });
  }
};

// Get user activity history
exports.getActivityHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;

    // Get user's reports and responses with pagination
    const [reports, responses] = await Promise.all([
      Report.find({ reporter: userId })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .populate('reporter', 'name')
        .lean(),
      Response.find({ responder: userId })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .populate('responder', 'name')
        .populate('report', 'missingPersonName')
        .lean()
    ]);

    // Combine and sort by date
    const activities = [
      ...reports.map(report => ({
        id: report._id,
        type: 'report',
        title: `Missing Person Report: ${report.missingPersonName}`,
        description: report.description,
        createdAt: report.createdAt,
        status: report.status || 'active'
      })),
      ...responses.map(response => ({
        id: response._id,
        type: 'response',
        title: `Response to: ${response.report?.missingPersonName || 'Report'}`,
        description: response.message,
        createdAt: response.createdAt,
        status: 'submitted'
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ 
      data: activities.slice(0, parseInt(limit)),
      total: activities.length
    });
  } catch (error) {
    console.error('Error fetching activity history:', error);
    res.status(500).json({ message: 'Error fetching activity history' });
  }
};
