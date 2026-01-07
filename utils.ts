/**
 * Shared utility functions
 */

import { SEAT_CONFIG } from "./constants";

/**
 * Extract seat number from project name
 * @param projectName - Project name in the format "組み込みシステム基礎 (N)"
 * @returns Seat number (1-80) or null if invalid
 */
export function extractSeatNumber(projectName: string): number | null {
  const match = projectName.match(SEAT_CONFIG.PROJECT_NAME_PATTERN);
  if (match?.[1]) {
    const num = parseInt(match[1], 10);
    if (num >= SEAT_CONFIG.MIN_SEAT_NUMBER && num <= SEAT_CONFIG.MAX_SEAT_NUMBER) {
      return num;
    }
  }
  return null;
}

/**
 * Validate if seat number is in valid range
 * @param seatNumber - Seat number to validate
 * @returns true if valid, false otherwise
 */
export function isValidSeatNumber(seatNumber: number): boolean {
  return seatNumber >= SEAT_CONFIG.MIN_SEAT_NUMBER && seatNumber <= SEAT_CONFIG.MAX_SEAT_NUMBER;
}

/**
 * Format date to Japanese locale string
 * @param dateString - ISO date string
 * @returns Formatted date string or "N/A" if invalid
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
