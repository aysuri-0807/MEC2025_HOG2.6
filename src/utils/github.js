/**
 * GitHub API utilities for saving files to repository.
 * Handles saving images and alerts to GitHub repository via REST API.
 * 
 * @author Ammaar Shareef
 */

const GITHUB_REPO_OWNER = 'AmmaarShareef';
const GITHUB_REPO_NAME = 'MEC-2025-Frontend';
const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Get GitHub token from environment variable
 */
const getGitHubToken = () => {
  return import.meta.env.VITE_GITHUB_TOKEN || '';
};

/**
 * Save a file to GitHub repository
 * @param {string} filePath - Path to file in repository (e.g., 'uploads/image.jpg')
 * @param {string} content - File content (base64 encoded for binary, plain text for text files)
 * @param {string} message - Commit message
 * @param {boolean} isBase64 - Whether content is base64 encoded
 * @returns {Promise<Object>} GitHub API response
 */
export const saveFileToGitHub = async (filePath, content, message, isBase64 = false) => {
  const token = getGitHubToken();
  
  if (!token) {
    throw new Error('GitHub token not configured. Please set VITE_GITHUB_TOKEN environment variable.');
  }

  try {
    // Check if file exists to get SHA for update
    let sha = null;
    try {
      const getResponse = await fetch(
        `${GITHUB_API_BASE}/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${filePath}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );
      
      if (getResponse.ok) {
        const fileData = await getResponse.json();
        sha = fileData.sha;
      }
    } catch (err) {
      // File doesn't exist, will create new
    }

    // Prepare content
    const encodedContent = isBase64 ? content : btoa(unescape(encodeURIComponent(content)));

    // Create or update file
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          content: encodedContent,
          sha: sha, // Include SHA if updating existing file
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save file to GitHub');
    }

    return await response.json();
  } catch (error) {
    console.error('GitHub API error:', error);
    throw error;
  }
};

/**
 * Save image to GitHub repository
 * @param {File} imageFile - Image file to save
 * @param {string} filename - Filename to save as
 * @returns {Promise<Object>} GitHub API response
 */
export const saveImageToGitHub = async (imageFile, filename) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        // Convert to base64
        const base64Content = reader.result.split(',')[1]; // Remove data:image/...;base64, prefix
        const filePath = `uploads/${filename}`;
        const message = `Add uploaded image: ${filename}`;
        
        const result = await saveFileToGitHub(filePath, base64Content, message, true);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
};

/**
 * Append alert to CSV file in GitHub
 * @param {Object} alertData - Alert data object
 * @returns {Promise<Object>} GitHub API response
 */
export const appendAlertToCSV = async (alertData) => {
  const token = getGitHubToken();
  
  if (!token) {
    throw new Error('GitHub token not configured. Please set VITE_GITHUB_TOKEN environment variable.');
  }

  try {
    // Get current CSV content
    let csvContent = '';
    let sha = null;
    
    try {
      const getResponse = await fetch(
        `${GITHUB_API_BASE}/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/Alerts.csv`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );
      
      if (getResponse.ok) {
        const fileData = await getResponse.json();
        csvContent = decodeURIComponent(escape(atob(fileData.content.replace(/\s/g, ''))));
        sha = fileData.sha;
      }
    } catch (err) {
      // File doesn't exist, create header
      csvContent = 'Location,Severity,Description,Contact Info,Timestamp,Status,Verified\n';
    }

    // Append new alert
    const newRow = [
      `"${alertData.location}"`,
      `"${alertData.severity}"`,
      `"${alertData.description.replace(/"/g, '""')}"`, // Escape quotes in CSV
      `"${alertData.contactInfo || ''}"`,
      `"${alertData.timestamp}"`,
      `"${alertData.status || 'pending'}"`,
      `"${alertData.verified || false}"`,
    ].join(',') + '\n';

    csvContent += newRow;

    // Save updated CSV
    const encodedContent = btoa(unescape(encodeURIComponent(csvContent)));
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/Alerts.csv`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Add alert: ${alertData.location}`,
          content: encodedContent,
          sha: sha,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save alert to CSV');
    }

    return await response.json();
  } catch (error) {
    console.error('GitHub API error:', error);
    throw error;
  }
};

/**
 * Fetch and parse CSV file from GitHub
 * @returns {Promise<Array>} Array of alert objects
 */
export const fetchAlertsFromCSV = async () => {
  try {
    // Fetch from GitHub Pages (public access)
    const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/main/Alerts.csv`);
    
    if (!response.ok) {
      // If file doesn't exist, return empty array
      return [];
    }

    const csvText = await response.text();
    
    if (!csvText.trim()) {
      return [];
    }

    // Parse CSV
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      return []; // Only header or empty
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const alerts = [];

    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          if (inQuotes && lines[i][j + 1] === '"') {
            current += '"';
            j++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim()); // Add last value

      if (values.length === headers.length) {
        const alert = {};
        headers.forEach((header, index) => {
          let value = values[index].replace(/^"|"$/g, ''); // Remove quotes
          value = value.replace(/""/g, '"'); // Unescape quotes
          
          // Convert to appropriate type
          if (header === 'Verified') {
            alert[header.toLowerCase()] = value === 'true';
          } else if (header === 'Timestamp') {
            alert['timestamp'] = value;
          } else {
            alert[header.toLowerCase().replace(/\s+/g, '')] = value;
          }
        });
        
        // Add ID and format
        alert.id = i;
        alert.reportedBy = alert.contactinfo ? 'Community Member' : 'Anonymous';
        alert.status = alert.status || 'pending';
        
        alerts.push(alert);
      }
    }

    return alerts;
  } catch (error) {
    console.error('Error fetching alerts from CSV:', error);
    return [];
  }
};

