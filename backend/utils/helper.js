// utils.js

// A simple logging function for your bot
export const logMessage = (message) => {
    console.log(`[${new Date().toISOString()}] ${message}`);
  };
  
  // A function to safely access nested properties in a data object (optional)
  export const getNestedValue = (obj, keyPath, defaultValue) => {
    return keyPath.split('.').reduce((prev, key) => prev && prev[key], obj) || defaultValue;
  };
  
  // Custom error handler (if needed)
  export const handleError = (error) => {
    console.error('An error occurred:', error);
  };
  