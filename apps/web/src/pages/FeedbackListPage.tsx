import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type SortByField, type SortOrder } from "../api/client";
import { feedbackKeys } from "../api/queryKeys";
import type { FeedbackRecord, Sentiment } from "../types";
import { Badge } from "../components/Badge";
import { TagList } from "../components/TagList";
import { SortableHeader } from "../components/SortableHeader";
import { FeedbackDetailModal } from "../components/FeedbackDetailModal";
import "./FeedbackListPage.css";

const SENTIMENTS: Array<Sentiment | ""> = ["", "positive", "neutral", "negative"];

export function FeedbackListPage() {
  const [page, setPage] = useState(1);
  const [sentiment, setSentiment] = useState("");
  const [tag, setTag] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortByField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selected, setSelected] = useState<FeedbackRecord | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...feedbackKeys.all, page, sentiment, tag, search, sortBy, sortOrder],
    queryFn: () =>
      api.listFeedback({
        page,
        pageSize: 10,
        sortBy,
        sortOrder,
        ...(sentiment ? { sentiment } : {}),
        ...(tag ? { tag } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      }),
  });

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  function handleSort(field: SortByField) {
    if (sortBy === field) {
      setSortOrder((order) => (order === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder(field === "createdAt" ? "desc" : "asc");
    }
    setPage(1);
  }

  return (
    <div className="list-page">
      <h1>Feedback List</h1>

      <div className="list-filters">
        <label>
          Sentiment
          <select
            value={sentiment}
            onChange={(e) => {
              setSentiment(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by sentiment"
          >
            <option value="">All</option>
            {SENTIMENTS.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tag
          <input
            type="text"
            value={tag}
            onChange={(e) => {
              setTag(e.target.value);
              setPage(1);
            }}
            placeholder="e.g. bug"
            aria-label="Filter by tag"
          />
        </label>
        <label className="list-filters__search">
          Search
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search feedback or summary…"
            aria-label="Search feedback text or summary"
          />
        </label>
      </div>

      {isLoading && <p className="list-state">Loading feedback…</p>}
      {isError && (
        <p className="list-state list-state--error" role="alert">
          {error.message}
        </p>
      )}

      {!isLoading && !isError && data?.items.length === 0 && (
        <p className="list-state">No feedback found. Try adjusting filters or submit new feedback.</p>
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="feedback-table">
              <thead>
                <tr>
                  <SortableHeader
                    label="Summary"
                    field="summary"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Sentiment"
                    field="sentiment"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Tags"
                    field="tags"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Priority"
                    field="priority"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Date"
                    field="createdAt"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr
                    key={item.id}
                    className="feedback-table__row"
                    onClick={() => setSelected(item)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelected(item)}
                  >
                    <td className="feedback-table__summary">{item.analysis.summary}</td>
                    <td>
                      <Badge label={item.analysis.sentiment} variant={item.analysis.sentiment} />
                    </td>
                    <td>
                      <TagList tags={item.analysis.tags} />
                    </td>
                    <td>
                      <Badge label={item.analysis.priority} variant={item.analysis.priority} />
                    </td>
                    <td className="feedback-table__date">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages || 1} ({data.total} total)
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}

      {selected && (
        <FeedbackDetailModal record={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
