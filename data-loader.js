/**
 * Data loader utility for the Contact Center Analytics Dashboard
 * 
 * This module provides functions for loading and caching dashboard data.
 * It handles fetching JSON files, error handling, and data caching.
 */

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Data cache
const dataCache = {};
const lastFetchTime = {};

/**
 * Load dashboard configuration from JSON file
 * 
 * @returns {Promise<Object>} Dashboard configuration
 * @throws {Error} If configuration cannot be loaded
 */
export const loadDashboardConfig = async () => {
  try {
    const response = await fetch('/data/dashboard_config.json');
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const config = await response.json();
    return config;
  } catch (err) {
    console.error('Error loading dashboard configuration:', err);
    throw new Error('Failed to load dashboard configuration');
  }
};

/**
 * Load all required JSON data files for the dashboard
 * 
 * @returns {Promise<Object>} Object containing all dashboard data
 * @throws {Error} If data cannot be loaded
 */
export const loadAllData = async () => {
  try {
    // Data files to load
    const dataFiles = [
      'channel_volume',
      'hourly_volume',
      'daily_volume',
      'wait_time_distribution',
      'sentiment_distribution',
      'agent_summary',
      'team_summary',
      'daily_metrics',
      'performance_distribution',
      'queue_summary',
      'channel_summary',
      'hourly_patterns',
      'weekly_patterns',
      'technology_summary',
      'integration_summary',
      'ai_summary',
      'daily_ai_metrics',
      'monthly_impact',
      'daily_cost',
      'daily_ai_impact',
      'summary_metrics',
      'formatted_metrics'
    ];
    
    // Load all data files in parallel
    const dataPromises = dataFiles.map(file => loadDataFile(file));
    
    // Wait for all data to load
    const results = await Promise.all(dataPromises);
    
    // Build data object with file names as keys
    const loadedData = {};
    dataFiles.forEach((file, index) => {
      loadedData[file] = results[index];
    });
    
    return loadedData;
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    throw new Error('Failed to load dashboard data');
  }
};

/**
 * Load a single data file from the server with caching
 * 
 * @param {string} fileName - Name of the data file to load (without extension)
 * @param {boolean} [forceRefresh=false] - Whether to force a refresh of cached data
 * @returns {Promise<Object>} Data from the file
 * @throws {Error} If data cannot be loaded
 */
export const loadDataFile = async (fileName, forceRefresh = false) => {
  const currentTime = new Date().getTime();
  
  // Return cached data if valid and not forcing refresh
  if (
    !forceRefresh &&
    dataCache[fileName] &&
    lastFetchTime[fileName] &&
    currentTime - lastFetchTime[fileName] < CACHE_DURATION
  ) {
    return dataCache[fileName];
  }
  
  try {
    // Fetch data from server
    const response = await fetch(`/data/${fileName}.json`);
    
    if (!response.ok) {
      // Handle 404 gracefully for optional files
      if (response.status === 404) {
        console.warn(`Data file not found: ${fileName}.json`);
        return null;
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    // Parse JSON response
    const data = await response.json();
    
    // Update cache
    dataCache[fileName] = data;
    lastFetchTime[fileName] = currentTime;
    
    return data;
  } catch (error) {
    console.error(`Error loading data file ${fileName}:`, error);
    
    // Return cached data even if expired in case of error
    if (dataCache[fileName]) {
      console.warn(`Using expired cached data for ${fileName}`);
      return dataCache[fileName];
    }
    
    throw new Error(`Failed to load ${fileName} data`);
  }
};

/**
 * Clear the data cache to force fresh data to be loaded
 */
export const clearDataCache = () => {
  // Clear all cached data
  Object.keys(dataCache).forEach(key => {
    delete dataCache[key];
    delete lastFetchTime[key];
  });
  
  console.log('Data cache cleared');
};

/**
 * Load data and retry if it fails
 * 
 * @param {string} fileName - Name of the data file to load
 * @param {number} [retries=3] - Number of retries before giving up
 * @param {number} [delay=1000] - Delay between retries in milliseconds
 * @returns {Promise<Object>} Data from the file
 * @throws {Error} If data cannot be loaded after all retries
 */
export const loadDataWithRetry = async (fileName, retries = 3, delay = 1000) => {
  try {
    return await loadDataFile(fileName);
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    console.warn(`Retrying loading ${fileName} data in ${delay}ms. Retries left: ${retries}`);
    
    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry with one fewer retry
    return loadDataWithRetry(fileName, retries - 1, delay * 1.5);
  }
};
