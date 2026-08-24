import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/* =========================================================
   DEVSync AI — GLOBAL UI UTILITIES
   ========================================================= */

/**
 * Combines Tailwind classes safely.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* =========================================================
   DATE & TIME
   ========================================================= */

export function formatDate(
  value?: string | Date | null,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    options ?? {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

export function formatDateTime(
  value?: string | Date | null,
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatShortDate(
  value?: string | Date | null,
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

/* =========================================================
   RELATIVE TIME
   ========================================================= */

export function formatRelativeTime(
  value?: string | Date | null,
): string {
  if (!value) {
    return "Unknown time";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  const now = Date.now();
  const difference = date.getTime() - now;

  const seconds = Math.round(
    Math.abs(difference) / 1000,
  );

  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30);

  const future = difference > 0;

  if (seconds < 45) {
    return "just now";
  }

  if (minutes < 60) {
    return future
      ? `in ${minutes}m`
      : `${minutes}m ago`;
  }

  if (hours < 24) {
    return future
      ? `in ${hours}h`
      : `${hours}h ago`;
  }

  if (days < 7) {
    return future
      ? `in ${days}d`
      : `${days}d ago`;
  }

  if (weeks < 5) {
    return future
      ? `in ${weeks}w`
      : `${weeks}w ago`;
  }

  return future
    ? `in ${months}mo`
    : `${months}mo ago`;
}

/* =========================================================
   DUE DATE HELPERS
   ========================================================= */

export function isOverdue(
  value?: string | Date | null,
): boolean {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.getTime() < Date.now();
}

export function isDueToday(
  value?: string | Date | null,
): boolean {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function daysUntil(
  value?: string | Date | null,
): number | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  date.setHours(0, 0, 0, 0);

  const difference =
    date.getTime() - today.getTime();

  return Math.ceil(
    difference / (1000 * 60 * 60 * 24),
  );
}

/* =========================================================
   USER / AVATAR HELPERS
   ========================================================= */

export function getInitials(
  name?: string | null,
  fallback = "U",
): string {
  if (!name?.trim()) {
    return fallback;
  }

  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`
    .toUpperCase();
}

export function getFirstName(
  name?: string | null,
): string {
  if (!name?.trim()) {
    return "there";
  }

  return name.trim().split(/\s+/)[0];
}

/* =========================================================
   STRING HELPERS
   ========================================================= */

export function truncate(
  value: string | null | undefined,
  length = 80,
): string {
  if (!value) {
    return "";
  }

  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, Math.max(0, length - 3)).trim()}...`;
}

export function capitalize(
  value?: string | null,
): string {
  if (!value) {
    return "";
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1).toLowerCase()
  );
}

export function titleCase(
  value?: string | null,
): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map(capitalize)
    .join(" ");
}

export function slugify(
  value: string,
): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* =========================================================
   NUMBER FORMATTERS
   ========================================================= */

export function formatNumber(
  value?: number | null,
): string {
  if (value === null || value === undefined) {
    return "0";
  }

  return new Intl.NumberFormat("en-IN").format(value);
}

export function formatCompactNumber(
  value?: number | null,
): string {
  if (value === null || value === undefined) {
    return "0";
  }

  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercentage(
  value?: number | null,
  decimals = 0,
): string {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(value)
  ) {
    return "0%";
  }

  return `${value.toFixed(decimals)}%`;
}

/* =========================================================
   CURRENCY
   ========================================================= */

export function formatCurrency(
  value?: number | null,
  currency = "INR",
): string {
  if (value === null || value === undefined) {
    return "₹0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/* =========================================================
   TASK STATUS
   ========================================================= */

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "DONE"
  | "BLOCKED"
  | "CANCELLED"
  | string;

export function getTaskStatusLabel(
  status?: TaskStatus | null,
): string {
  if (!status) {
    return "Unknown";
  }

  const labels: Record<string, string> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    REVIEW: "In Review",
    DONE: "Completed",
    BLOCKED: "Blocked",
    CANCELLED: "Cancelled",
  };

  return (
    labels[status] ??
    titleCase(status)
  );
}

/* =========================================================
   PRIORITY
   ========================================================= */

export type Priority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT"
  | string;

export function getPriorityLabel(
  priority?: Priority | null,
): string {
  if (!priority) {
    return "No Priority";
  }

  const labels: Record<string, string> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    URGENT: "Urgent",
  };

  return (
    labels[priority] ??
    titleCase(priority)
  );
}

/* =========================================================
   RISK
   ========================================================= */

export type RiskSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"
  | string;

export function getRiskSeverityLabel(
  severity?: RiskSeverity | null,
): string {
  if (!severity) {
    return "Unknown";
  }

  const labels: Record<string, string> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    CRITICAL: "Critical",
  };

  return (
    labels[severity] ??
    titleCase(severity)
  );
}

export function getRiskScoreLabel(
  score?: number | null,
): string {
  if (
    score === null ||
    score === undefined
  ) {
    return "No score";
  }

  if (score >= 80) {
    return "Critical";
  }

  if (score >= 60) {
    return "High";
  }

  if (score >= 30) {
    return "Medium";
  }

  return "Low";
}

/* =========================================================
   SEARCH
   ========================================================= */

export function matchesSearch(
  value: unknown,
  query: string,
): boolean {
  if (!query.trim()) {
    return true;
  }

  return String(value ?? "")
    .toLowerCase()
    .includes(query.trim().toLowerCase());
}

export function filterBySearch<T>(
  items: T[],
  query: string,
  getSearchText: (item: T) => string,
): T[] {
  if (!query.trim()) {
    return items;
  }

  const normalized = query
    .trim()
    .toLowerCase();

  return items.filter((item) =>
    getSearchText(item)
      .toLowerCase()
      .includes(normalized),
  );
}

/* =========================================================
   SAFE JSON
   ========================================================= */

export function safeJsonParse<T>(
  value: string,
  fallback: T,
): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/* =========================================================
   DEBOUNCE
   ========================================================= */

export function debounce<
  T extends (...args: any[]) => void,
>(
  callback: T,
  delay = 300,
) {
  let timeout: ReturnType<
    typeof setTimeout
  > | undefined;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

/* =========================================================
   ID
   ========================================================= */

export function generateId(
  prefix = "id",
): string {
  const random =
    Math.random()
      .toString(36)
      .substring(2, 10);

  return `${prefix}_${Date.now()}_${random}`;
}

/* =========================================================
   ARRAY HELPERS
   ========================================================= */

export function unique<T>(
  items: T[],
): T[] {
  return Array.from(new Set(items));
}

export function uniqueBy<T>(
  items: T[],
  getKey: (item: T) => string | number,
): T[] {
  const seen = new Set<string | number>();

  return items.filter((item) => {
    const key = getKey(item);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

/* =========================================================
   OBJECT HELPERS
   ========================================================= */

export function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/* =========================================================
   ERROR HANDLING
   ========================================================= */

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong.",
): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (
    isObject(error) &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
}

/* =========================================================
   FILE HELPERS
   ========================================================= */

export function formatFileSize(
  bytes?: number | null,
): string {
  if (
    bytes === null ||
    bytes === undefined ||
    bytes <= 0
  ) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB",
  ];

  const index = Math.floor(
    Math.log(bytes) / Math.log(1024),
  );

  const size =
    bytes / Math.pow(1024, index);

  return `${size.toFixed(
    index === 0 ? 0 : 1,
  )} ${units[index]}`;
}

/* =========================================================
   URL HELPERS
   ========================================================= */

export function isExternalUrl(
  value: string,
): boolean {
  return /^https?:\/\//i.test(value);
}

/* =========================================================
   COLOR / IDENTIFIER HELPERS
   ========================================================= */

export function stringToHue(
  value?: string | null,
): number {
  if (!value) {
    return 220;
  }

  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash =
      value.charCodeAt(i) +
      ((hash << 5) - hash);
  }

  return Math.abs(hash) % 360;
}

/* =========================================================
   TASK DISPLAY
   ========================================================= */

export function getTaskStatusTone(
  status?: TaskStatus | null,
): string {
  switch (status) {
    case "DONE":
      return "success";

    case "IN_PROGRESS":
      return "info";

    case "REVIEW":
      return "warning";

    case "BLOCKED":
      return "danger";

    case "CANCELLED":
      return "muted";

    default:
      return "neutral";
  }
}

export function getPriorityTone(
  priority?: Priority | null,
): string {
  switch (priority) {
    case "URGENT":
      return "danger";

    case "HIGH":
      return "warning";

    case "MEDIUM":
      return "info";

    case "LOW":
      return "success";

    default:
      return "neutral";
  }
}

export function getRiskTone(
  severity?: RiskSeverity | null,
): string {
  switch (severity) {
    case "CRITICAL":
      return "danger";

    case "HIGH":
      return "warning";

    case "MEDIUM":
      return "info";

    case "LOW":
      return "success";

    default:
      return "neutral";
  }
}