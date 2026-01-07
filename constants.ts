/**
 * Application-wide constants
 */

// Redmine Status IDs
export const REDMINE_STATUS = {
  PENDING_REVIEW: 4, // 審査待ち
  APPROVED: 3, // 審査通過
} as const;

// Redmine Tracker IDs
export const REDMINE_TRACKER = {
  TASK: 5, // 課題
} as const;

// Seat configuration
export const SEAT_CONFIG = {
  MIN_SEAT_NUMBER: 1,
  MAX_SEAT_NUMBER: 80,
  PROJECT_NAME_PATTERN: /組み込みシステム基礎\s*\((\d+)\)/,
} as const;

// Update intervals
export const UPDATE_INTERVAL = 10000; // 10秒

// API endpoints
export const API_ENDPOINTS = {
  TICKETS: "/api/tickets",
  TICKET_BY_SEAT: (seatNumber: number) => `/api/tickets/seat/${seatNumber}`,
  APPROVE_TICKET: (ticketId: number) => `/api/tickets/${ticketId}/approve`,
} as const;
