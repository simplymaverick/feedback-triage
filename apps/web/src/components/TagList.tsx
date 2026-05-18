import { Badge } from "./Badge";

interface TagListProps {
  tags: string[];
}

export function TagList({ tags }: TagListProps) {
  if (tags.length === 0) return <span className="text-muted">—</span>;

  return (
    <div className="tag-list">
      {tags.map((tag) => (
        <Badge key={tag} label={tag} variant="default" />
      ))}
    </div>
  );
}
