const { db } = require('../config/firebase');

// Get latest ESP32 GPS data
const getLatestData = async (req, res) => {
  try {
    const dataRef = db.ref('health-tracker/current-status');
    const snapshot = await dataRef.once('value');
    const data = snapshot.val() || {};
    
    // Return default data structure even if no data is found
    const defaultData = {
      latitude: 0,
      longitude: 0,
      gps_valid: false,
      timestamp: new Date().toISOString(),  // This will be the actual current time
      wifi_connected: false,
      firebase_ready: false,
      last_update: Date.now()  // Add millisecond timestamp for easier comparison
    };

    const responseData = {
      ...defaultData,
      ...data,
      // Ensure timestamp is always valid and current when no data
      timestamp: data.timestamp || defaultData.timestamp,
      last_update: data.last_update || defaultData.last_update
    };

    res.json({ data: responseData });
  } catch (error) {
    console.error('Error fetching ESP32 data:', error);
    // Return default offline data instead of error
    res.json({ 
      data: {
        latitude: 0,
        longitude: 0,
        gps_valid: false,
        timestamp: new Date().toISOString(),
        last_update: Date.now(),
        wifi_connected: false,
        firebase_ready: false
      }
    });
  }
};

// Get ESP32 GPS data history
const getDataHistory = async (req, res) => {
  try {
    const gpsRef = db.ref('health-tracker/gps');
    const snapshot = await gpsRef.limitToLast(10).once('value');
    const data = snapshot.val();
    
    if (!data) {
      return res.status(404).json({ message: 'No ESP32 GPS history found' });
    }
    
    const dataArray = Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));
    
    res.json({ 
      data: dataArray,
      count: dataArray.length
    });
  } catch (error) {
    console.error('Error fetching ESP32 GPS history:', error);
    res.status(500).json({ message: 'Error fetching ESP32 GPS history' });
  }
};

// Get current ESP32 status
const getStatus = async (req, res) => {
  try {
    const dataRef = db.ref('health-tracker/current-status');
    const snapshot = await dataRef.once('value');
    const data = snapshot.val() || {};
    
    // Return simplified status object matching frontend expectations
    // Default all values to false if data is missing
    const status = {
      wifi: Boolean(data.wifi_connected),
      gps: Boolean(data.gps_valid),
      heartbeat: Boolean(data.bpm_valid),
      lastUpdate: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString()
    };
    
    // Wrap the status in a data object to match frontend expectations
    res.json({ data: status });
  } catch (error) {
    console.error('Error fetching ESP32 status:', error);
    // Return offline status instead of error
    res.json({
      data: {
        wifi: false,
        gps: false,
        heartbeat: false,
        lastUpdate: new Date().toISOString()
      }
    });
  }
};

// Get health data from Firebase
const getHealthData = async (req, res) => {
  try {
    console.log('Backend: Fetching health data from Firebase...');
    const dataRef = db.ref('health-tracker/latest-health');
    console.log('Backend: Firebase reference created, fetching data...');
    
    const snapshot = await dataRef.once('value');
    console.log('Backend: Firebase snapshot received');
    
    const data = snapshot.val();
    console.log('Backend: Firebase data:', data);
    
    const currentTime = new Date();
    const currentTimestamp = currentTime.toISOString();
    const currentMillis = Date.now();

    // Create default health data structure
    const healthData = {
      heartRate: {
        bpm: 0,
        valid: false,
        status: 'No Signal',
        zone: 'No Signal'
      },
      pulse: {
        value: 0,
        threshold: 3300,
        signal: 'No Signal'
      },
      waveform: [],
      timestamp: currentTimestamp,
      last_update: currentMillis,
      device: 'ESP32_Health_Tracker',
      healthId: 'offline'
    };

    // If we have data, merge it with default structure
    if (data) {
      healthData.heartRate.bpm = data.bpm || 0;
      healthData.heartRate.valid = data.valid_bpm || false;
      healthData.heartRate.status = getHeartRateStatus(data.bpm);
      healthData.heartRate.zone = getHeartRateZone(data.bpm);
      healthData.pulse.value = data.pulse_value || 0;
      healthData.pulse.signal = getPulseSignalStatus(data.pulse_value);
      healthData.waveform = data.waveform || [];
      // Only use data timestamp if it's valid and not in the future
      if (data.timestamp && new Date(data.timestamp) <= currentTime) {
        healthData.timestamp = data.timestamp;
        healthData.last_update = new Date(data.timestamp).getTime();
      }
      healthData.device = data.device || healthData.device;
      healthData.healthId = data.health_id || healthData.healthId;
    }
    
    console.log('Backend: Sending health data to frontend:', healthData);
    res.json({ data: healthData });
  } catch (error) {
    console.error('Backend: Error fetching heartbeat data:', error);
    console.error('Backend: Error details:', error.message);
    
    // Return default offline data instead of error
    res.json({ 
      data: {
        heartRate: {
          bpm: 0,
          valid: false,
          status: 'No Signal',
          zone: 'No Signal'
        },
        pulse: {
          value: 0,
          threshold: 3300,
          signal: 'No Signal'
        },
        waveform: [],
        timestamp: new Date().toISOString(),
        last_update: Date.now(),
        device: 'ESP32_Health_Tracker',
        healthId: 'offline'
      }
    });
  }
};

// Get combined data (GPS + Heartbeat) - all real data from ESP32
const getCombinedData = async (req, res) => {
  try {
    const statusRef = db.ref('health-tracker/current-status');
    const healthRef = db.ref('health-tracker/latest-health');
    
    const [statusSnapshot, healthSnapshot] = await Promise.all([
      statusRef.once('value'),
      healthRef.once('value')
    ]);
    
    const statusData = statusSnapshot.val();
    const healthData = healthSnapshot.val();
    
    if (!statusData) {
      return res.status(404).json({ message: 'No ESP32 data found' });
    }
    
    const combinedData = {
      gps: statusData.gps_valid ? {
        latitude: statusData.latitude,
        longitude: statusData.longitude,
        valid: statusData.gps_valid,
        timestamp: statusData.timestamp
      } : {
        valid: false,
        message: 'GPS signal not available'
      },
      heartbeat: healthData ? {
        bpm: healthData.bpm || 0,
        valid: healthData.valid_bpm || false,
        status: getHeartRateStatus(healthData.bpm),
        zone: getHeartRateZone(healthData.bpm),
        pulseValue: healthData.pulse_value || 0,
        waveform: healthData.waveform || []
      } : {
        valid: false,
        message: 'Heartbeat data not available'
      },
      system: {
        wifi: statusData.wifi_connected,
        firebase: statusData.firebase_ready,
        device: statusData.device || 'ESP32_Health_Tracker',
        timestamp: statusData.timestamp
      }
    };
    
    res.json({ data: combinedData });
  } catch (error) {
    console.error('Error fetching combined data:', error);
    res.status(500).json({ message: 'Error fetching combined data' });
  }
};

// Get heartbeat history
const getHeartbeatHistory = async (req, res) => {
  try {
    const dataRef = db.ref('health-tracker/heartbeat');
    const snapshot = await dataRef.limitToLast(20).once('value');
    const data = snapshot.val();
    
    if (!data) {
      return res.status(404).json({ message: 'No heartbeat history found' });
    }
    
    const dataArray = Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    }));
    
    res.json({ 
      data: dataArray,
      count: dataArray.length
    });
  } catch (error) {
    console.error('Error fetching heartbeat history:', error);
    res.status(500).json({ message: 'Error fetching heartbeat history' });
  }
};

// Test Firebase connectivity
const testFirebase = async (req, res) => {
  try {
    console.log('Backend: Testing Firebase connectivity...');
    
    // Test basic Firebase connection
    const testRef = db.ref('health-tracker');
    const snapshot = await testRef.once('value');
    const data = snapshot.val();
    
    console.log('Backend: Firebase test - Available data:', data);
    
    res.json({ 
      message: 'Firebase connection test',
      connected: true,
      availablePaths: data ? Object.keys(data) : [],
      sampleData: data
    });
  } catch (error) {
    console.error('Backend: Firebase connection test failed:', error);
    res.status(500).json({ 
      message: 'Firebase connection test failed',
      error: error.message,
      connected: false
    });
  }
};

// Helper functions for health status analysis
function getHeartRateStatus(bpm) {
  if (!bpm || bpm === 0) return 'No Signal';
  
  if (bpm < 60) return 'Slow';
  if (bpm >= 60 && bpm <= 100) return 'Normal';
  if (bpm > 100 && bpm <= 140) return 'Elevated';
  return 'High';
}

function getHeartRateZone(bpm) {
  if (!bpm || bpm === 0) return 'No Signal';
  
  if (bpm < 60) return 'Resting';
  if (bpm < 100) return 'Normal';
  if (bpm < 140) return 'Light Exercise';
  if (bpm < 170) return 'Moderate Exercise';
  return 'Intense Exercise';
}

function getPulseSignalStatus(pulseValue) {
  if (!pulseValue) return 'No Signal';
  
  if (pulseValue < 1000) return 'Very Weak';
  if (pulseValue < 2000) return 'Weak';
  if (pulseValue < 3000) return 'Normal';
  if (pulseValue < 4000) return 'Strong';
  return 'Very Strong';
}

// Validate heart rate measurement with enhanced checks
const validateHeartRate = async (req, res) => {
  try {
    console.log('Backend: Validating heart rate measurement...');
    
    // Get current health data
    const dataRef = db.ref('health-tracker/latest-health');
    const snapshot = await dataRef.once('value');
    const data = snapshot.val();
    
    if (!data) {
      return res.status(404).json({ 
        valid: false, 
        message: 'No heartbeat data found',
        reason: 'No data available'
      });
    }
    
    // Backend validation criteria - Much more lenient
    const validation = {
      pulseValue: {
        valid: data.pulse_value >= 500 && data.pulse_value <= 8000, // More lenient range
        value: data.pulse_value,
        range: '500-8000'
      },
      heartRate: {
        valid: data.bpm >= 30 && data.bpm <= 220 && data.valid_bpm, // More lenient range
        value: data.bpm,
        range: '30-220 BPM'
      },
      waveform: {
        valid: data.waveform && data.waveform.length >= 10, // Much less data needed
        length: data.waveform ? data.waveform.length : 0,
        required: 10
      },
      signalQuality: {
        valid: data.pulse_value >= 500 && data.pulse_value <= 8000, // More lenient range
        value: data.pulse_value,
        range: '500-8000'
      }
    };
    
    // Overall validation
    const isValid = Object.values(validation).every(v => v.valid);
    
    console.log('Backend: Heart rate validation result:', { isValid, validation });
    
    res.json({
      valid: isValid,
      message: isValid ? 'Heart rate validation passed' : 'Heart rate validation failed',
      validation: validation,
      data: {
        bpm: data.bpm,
        pulseValue: data.pulse_value,
        waveformLength: data.waveform ? data.waveform.length : 0,
        timestamp: data.timestamp
      }
    });
  } catch (error) {
    console.error('Backend: Error validating heart rate:', error);
    res.status(500).json({ 
      valid: false, 
      message: 'Error validating heart rate',
      error: error.message 
    });
  }
};

// Get average heart rate over time period - More robust
const getAverageHeartRate = async (req, res) => {
  try {
    console.log('Backend: Calculating average heart rate...');
    
    // Get current health data instead of historical data
    const dataRef = db.ref('health-tracker/latest-health');
    const snapshot = await dataRef.once('value');
    const data = snapshot.val();
    
    console.log('Backend: Raw Firebase data:', JSON.stringify(data, null, 2));
    
    if (!data) {
      console.log('Backend: No data found in Firebase');
      return res.status(404).json({ 
        message: 'No heartbeat data found',
        averageBPM: 0,
        readingsCount: 0
      });
    }
    
    // Use current reading as average since we don't have historical data
    // This is more reliable than trying to query non-existent historical data
    // Check multiple possible field names for BPM
    let currentBPM = 0;
    
    // Try different possible field names
    if (data.bpm !== undefined) {
      currentBPM = data.bpm;
      console.log('Backend: Found BPM in data.bpm:', currentBPM);
    } else if (data.heartRate && data.heartRate.bpm !== undefined) {
      currentBPM = data.heartRate.bpm;
      console.log('Backend: Found BPM in data.heartRate.bpm:', currentBPM);
    } else if (data.heart_rate !== undefined) {
      currentBPM = data.heart_rate;
      console.log('Backend: Found BPM in data.heart_rate:', currentBPM);
    } else if (data.heartbeat !== undefined) {
      currentBPM = data.heartbeat;
      console.log('Backend: Found BPM in data.heartbeat:', currentBPM);
    } else if (data.BPM !== undefined) {
      currentBPM = data.BPM;
      console.log('Backend: Found BPM in data.BPM:', currentBPM);
    } else if (data.HeartRate !== undefined) {
      currentBPM = data.HeartRate;
      console.log('Backend: Found BPM in data.HeartRate:', currentBPM);
    } else {
      console.log('Backend: No BPM field found in data');
    }
    
    // Check validity - also check multiple possible validity fields
    const isValidBPM = data.valid_bpm !== undefined ? data.valid_bpm : 
                      data.validBPM !== undefined ? data.validBPM :
                      data.heartRate && data.heartRate.valid !== undefined ? data.heartRate.valid :
                      true; // Default to true if no validity field found
    
    const isValid = isValidBPM && currentBPM > 0 && currentBPM < 220;
    
    console.log('Backend: Processing data:', {
      currentBPM,
      isValidBPM,
      isValid,
      rawData: data,
      fieldCheck: {
        bpm: data.bpm,
        heartRate: data.heartRate,
        heart_rate: data.heart_rate,
        heartbeat: data.heartbeat,
        BPM: data.BPM,
        HeartRate: data.HeartRate
      }
    });
    
    if (!isValid) {
      console.log('Backend: Current reading is not valid');
      return res.status(400).json({ 
        message: 'Current heartbeat reading is not valid',
        averageBPM: 0,
        readingsCount: 0,
        debug: { currentBPM, valid_bpm: data.valid_bpm, isValid }
      });
    }
    
    console.log('Backend: Using current heart rate as average:', { averageBPM: currentBPM, readingsCount: 1 });
    
    res.json({
      averageBPM: Math.round(currentBPM),
      readingsCount: 1,
      timePeriod: 10000,
      readings: [{ bpm: currentBPM, timestamp: data.timestamp }],
      note: 'Using current reading as average (historical data not available)',
      debug: { rawBPM: currentBPM, roundedBPM: Math.round(currentBPM) }
    });
  } catch (error) {
    console.error('Backend: Error calculating average heart rate:', error);
    res.status(500).json({ 
      message: 'Error calculating average heart rate',
      error: error.message 
    });
  }
};

// Debug endpoint to check Firebase data structure
const debugFirebaseData = async (req, res) => {
  try {
    console.log('Backend: Debugging Firebase data structure...');
    
    // Check different paths
    const latestHealthRef = db.ref('health-tracker/latest-health');
    const heartbeatRef = db.ref('health-tracker/heartbeat');
    const currentStatusRef = db.ref('health-tracker/current-status');
    
    const [latestHealthSnapshot, heartbeatSnapshot, currentStatusSnapshot] = await Promise.all([
      latestHealthRef.once('value'),
      heartbeatRef.once('value'),
      currentStatusRef.once('value')
    ]);
    
    const latestHealth = latestHealthSnapshot.val();
    const heartbeat = heartbeatSnapshot.val();
    const currentStatus = currentStatusSnapshot.val();
    
    console.log('Backend: Firebase data debug:', {
      latestHealth: latestHealth ? Object.keys(latestHealth) : 'null',
      heartbeat: heartbeat ? Object.keys(heartbeat) : 'null',
      currentStatus: currentStatus ? Object.keys(currentStatus) : 'null'
    });
    
    res.json({
      message: 'Firebase data structure debug',
      latestHealth: latestHealth,
      heartbeat: heartbeat,
      currentStatus: currentStatus,
      availablePaths: {
        latestHealth: latestHealth ? Object.keys(latestHealth) : [],
        heartbeat: heartbeat ? Object.keys(heartbeat) : [],
        currentStatus: currentStatus ? Object.keys(currentStatus) : []
      }
    });
  } catch (error) {
    console.error('Backend: Error debugging Firebase data:', error);
    res.status(500).json({ 
      message: 'Error debugging Firebase data',
      error: error.message 
    });
  }
};

// Get current health data structure for debugging
const getCurrentHealthData = async (req, res) => {
  try {
    console.log('Backend: Getting current health data structure...');
    
    const dataRef = db.ref('health-tracker/latest-health');
    const snapshot = await dataRef.once('value');
    const data = snapshot.val();
    
    console.log('Backend: Current health data structure:', data);
    
    if (!data) {
      return res.status(404).json({ 
        message: 'No health data found',
        data: null
      });
    }
    
    // Check all possible BPM fields
    const possibleBPMFields = {
      bpm: data.bpm,
      heartRate: data.heartRate,
      heart_rate: data.heart_rate,
      heartbeat: data.heartbeat,
      BPM: data.BPM,
      HeartRate: data.HeartRate
    };
    
    console.log('Backend: Possible BPM fields:', possibleBPMFields);
    
    res.json({
      message: 'Current health data structure',
      data: data,
      possibleBPMFields: possibleBPMFields,
      allFields: Object.keys(data)
    });
  } catch (error) {
    console.error('Backend: Error getting current health data:', error);
    res.status(500).json({ 
      message: 'Error getting current health data',
      error: error.message 
    });
  }
};

// Simple test endpoint to get raw ESP32 data
const getRawESP32Data = async (req, res) => {
  try {
    console.log('Backend: Getting raw ESP32 data...');
    
    const dataRef = db.ref('health-tracker/latest-health');
    const snapshot = await dataRef.once('value');
    const data = snapshot.val();
    
    console.log('Backend: Raw ESP32 data:', JSON.stringify(data, null, 2));
    
    res.json({
      message: 'Raw ESP32 data',
      timestamp: new Date().toISOString(),
      data: data,
      dataType: typeof data,
      isNull: data === null,
      isUndefined: data === undefined
    });
  } catch (error) {
    console.error('Backend: Error getting raw ESP32 data:', error);
    res.status(500).json({ 
      message: 'Error getting raw ESP32 data',
      error: error.message 
    });
  }
};

// Test if ESP32 data is changing
const testESP32DataChange = async (req, res) => {
  try {
    console.log('Backend: Testing ESP32 data change...');
    
    const dataRef = db.ref('health-tracker/latest-health');
    
    // Get data multiple times to see if it changes
    const readings = [];
    for (let i = 0; i < 5; i++) {
      const snapshot = await dataRef.once('value');
      const data = snapshot.val();
      readings.push({
        timestamp: new Date().toISOString(),
        data: data,
        bpm: data?.bpm || 'N/A'
      });
      
      // Wait 1 second between readings
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('Backend: ESP32 data change test:', readings);
    
    // Check if BPM values are different
    const bpmValues = readings.map(r => r.bpm).filter(bpm => bpm !== 'N/A');
    const uniqueBPMs = [...new Set(bpmValues)];
    const isChanging = uniqueBPMs.length > 1;
    
    res.json({
      message: 'ESP32 data change test',
      readings: readings,
      bpmValues: bpmValues,
      uniqueBPMs: uniqueBPMs,
      isChanging: isChanging,
      conclusion: isChanging ? 'Data is changing' : 'Data is static (same value)'
    });
  } catch (error) {
    console.error('Backend: Error testing ESP32 data change:', error);
    res.status(500).json({ 
      message: 'Error testing ESP32 data change',
      error: error.message 
    });
  }
};

module.exports = {
  getLatestData,
  getDataHistory,
  getStatus,
  getHealthData,
  getCombinedData,
  getHeartbeatHistory,
  testFirebase,
  validateHeartRate,
  getAverageHeartRate,
  debugFirebaseData,
  getCurrentHealthData,
  getRawESP32Data,
  testESP32DataChange
}; 
