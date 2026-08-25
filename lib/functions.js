import axios from 'axios';
import { fileTypeFromBuffer } from 'file-type';

/**
 * Fetch Json Data from URL
 */
export const getJson = async (url, options = {}) => {
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      ...options
    });
    return res.data;
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * Get Buffer from URL
 */
export const getBuffer = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'get',
      url,
      headers: {
        DNT: 1,
        'Upgrade-Insecure-Request': 1
      },
      responseType: 'arraybuffer',
      ...options
    });
    return res.data;
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * Custom Delay Utility
 */
export const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Format Bytes into Human Readable String
 */
export const formatSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
