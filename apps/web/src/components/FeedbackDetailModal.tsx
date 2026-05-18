import type { FeedbackRecord } from "../types";
import { Badge } from "./Badge";
import { TagList } from "./TagList";
import "./FeedbackDetailModal.css";

interface FeedbackDetailModalProps {
  record: FeedbackRecord;
  onClose: () => void;
}

export function FeedbackDetailModal({ record, onClose }: FeedbackDetailModalProps) {
  const { analysis } = record;

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id="detail-title">Feedback Detail</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="modal__body">
          <section>
            <h3>Feedback</h3>
            <p className="modal__text">{record.text}</p>
            {record.email && (
              <p className="modal__meta">
                <strong>Email:</strong> {record.email}
              </p>
            )}
            <p className="modal__meta">
              <strong>Submitted:</strong> {new Date(record.createdAt).toLocaleString()}
            </p>
          </section>
          <section>
            <h3>Analysis</h3>
            <div className="modal__badges">
              <Badge label={analysis.sentiment} variant={analysis.sentiment} />
              <Badge label={analysis.priority} variant={analysis.priority} />
            </div>
            <p className="modal__summary">{analysis.summary}</p>
            <div className="modal__row">
              <strong>Tags:</strong> <TagList tags={analysis.tags} />
            </div>
            <p>
              <strong>Next action:</strong> {analysis.nextAction}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
