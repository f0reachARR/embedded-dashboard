/**
 * Environment configuration with validation
 */

import { REDMINE_STATUS, REDMINE_TRACKER } from "./constants";

interface Config {
  redmine: {
    url: string;
    apiKey: string;
    trackerId: number;
    statusId: number;
  };
  server: {
    port: number;
  };
}

/**
 * Validate and parse environment variables
 */
function validateConfig(): Config {
  const apiKey = process.env.REDMINE_API_KEY || "";
  
  if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
    throw new Error("REDMINE_API_KEY is not configured. Please set it in .env file.");
  }

  const redmineUrl = process.env.REDMINE_URL || "https://vps2.is.kit.ac.jp/redmine";
  const trackerId = parseInt(process.env.TRACKER_ID || String(REDMINE_TRACKER.TASK), 10);
  const statusId = parseInt(process.env.STATUS_ID || String(REDMINE_STATUS.PENDING_REVIEW), 10);
  const port = parseInt(process.env.PORT || "3000", 10);

  if (isNaN(trackerId) || trackerId <= 0) {
    throw new Error("Invalid TRACKER_ID in environment variables");
  }

  if (isNaN(statusId) || statusId <= 0) {
    throw new Error("Invalid STATUS_ID in environment variables");
  }

  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error("Invalid PORT in environment variables");
  }

  return {
    redmine: {
      url: redmineUrl,
      apiKey,
      trackerId,
      statusId,
    },
    server: {
      port,
    },
  };
}

/**
 * Get validated configuration
 */
export const config = validateConfig();

/**
 * Create headers for Redmine API requests
 */
export function createRedmineHeaders(): HeadersInit {
  return {
    "X-Redmine-API-Key": config.redmine.apiKey,
    "Content-Type": "application/json",
  };
}
