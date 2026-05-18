import type { SortByField, SortOrder } from "../api/client";
import "./SortableHeader.css";

interface SortableHeaderProps {
  label: string;
  field: SortByField;
  sortBy: SortByField;
  sortOrder: SortOrder;
  onSort: (field: SortByField) => void;
}

export function SortableHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
}: SortableHeaderProps) {
  const isActive = sortBy === field;

  return (
    <th scope="col">
      <button
        type="button"
        className={`sortable-header${isActive ? " sortable-header--active" : ""}`}
        onClick={() => onSort(field)}
        aria-sort={
          isActive ? (sortOrder === "asc" ? "ascending" : "descending") : "none"
        }
      >
        <span>{label}</span>
        <span className="sortable-header__icon" aria-hidden="true">
          {isActive ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}
