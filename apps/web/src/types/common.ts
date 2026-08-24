/**
 * Shared type definitions used across DevSync AI.
 *
 * Keep this file dependency-free so it can safely be imported
 * by projects, tasks, users, analytics, AI features, etc.
 */

/* -------------------------------------------------------------------------- */
/* Core                                                                        */
/* -------------------------------------------------------------------------- */

export type ID = string;

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

/* -------------------------------------------------------------------------- */
/* Generic status / priority                                                   */
/* -------------------------------------------------------------------------- */

export type Status =
  | "active"
  | "inactive"
  | "pending"
  | "completed"
  | "archived";

export type Priority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type RiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type SortDirection = "asc" | "desc";

/* -------------------------------------------------------------------------- */
/* Pagination                                                                  */
/* -------------------------------------------------------------------------- */

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

/* -------------------------------------------------------------------------- */
/* API                                                                         */
/* -------------------------------------------------------------------------- */

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

/* -------------------------------------------------------------------------- */
/* UI select options                                                           */
/* -------------------------------------------------------------------------- */

export interface SelectOption<T = string> {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Date / time                                                                 */
/* -------------------------------------------------------------------------- */

export interface DateRange {
  from: string | null;
  to: string | null;
}

export interface TimeStamped {
  createdAt: string;
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/* Generic loading state                                                       */
/* -------------------------------------------------------------------------- */

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

/* -------------------------------------------------------------------------- */
/* Search                                                                      */
/* -------------------------------------------------------------------------- */

export interface SearchParams {
  query?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: SortDirection;
}

/* -------------------------------------------------------------------------- */
/* Generic key/value metadata                                                  */
/* -------------------------------------------------------------------------- */

export interface Metadata {
  [key: string]: unknown;
}