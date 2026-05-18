import type { ApiError, FeedbackRecord, PaginatedFeedback } from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as ApiError;
      message = body.error?.message ?? message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export type SortByField = "summary" | "sentiment" | "tags" | "priority" | "createdAt";
export type SortOrder = "asc" | "desc";

interface ListParams {
  page?: number;
  pageSize?: number;
  sentiment?: string;
  tag?: string;
  search?: string;
  sortBy?: SortByField;
  sortOrder?: SortOrder;
}

export const api = {
  createFeedback: (body: { text: string; email?: string }) =>
    request<FeedbackRecord>("/api/feedback", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listFeedback: (params: ListParams = {}) => {
    const search = new URLSearchParams();
    if (params.page) search.set("page", String(params.page));
    if (params.pageSize) search.set("pageSize", String(params.pageSize));
    if (params.sentiment) search.set("sentiment", params.sentiment);
    if (params.tag) search.set("tag", params.tag);
    if (params.search) search.set("search", params.search);
    if (params.sortBy) search.set("sortBy", params.sortBy);
    if (params.sortOrder) search.set("sortOrder", params.sortOrder);
    const qs = search.toString();
    return request<PaginatedFeedback>(`/api/feedback${qs ? `?${qs}` : ""}`);
  },
};
