import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { feedbackKeys } from "../api/queryKeys";
import "./SubmitPage.css";

export function SubmitPage() {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [email, setEmail] = useState("");
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      api.createFeedback({
        text: text.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
      }),
    onSuccess: (data) => {
      setSubmittedId(data.id);
      setText("");
      setEmail("");
      void queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    mutation.mutate();
  }

  return (
    <div className="submit-page">
      <h1>Submit Feedback</h1>
      <p className="submit-page__lead">
        Share product feedback and get AI-powered triage analysis instantly.
      </p>

      <form className="submit-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="feedback-text">
          Feedback <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="feedback-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe your experience, issue, or suggestion…"
          rows={6}
          required
          disabled={mutation.isPending}
        />

        <label htmlFor="feedback-email">Email (optional)</label>
        <input
          id="feedback-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={mutation.isPending}
        />

        <button type="submit" disabled={mutation.isPending || !text.trim()}>
          {mutation.isPending ? "Analyzing…" : "Submit Feedback"}
        </button>

        {mutation.isError && (
          <p className="submit-form__error" role="alert">
            {mutation.error.message}
          </p>
        )}

        {submittedId && mutation.isSuccess && (
          <p className="submit-form__success" role="status">
            Feedback submitted successfully!{" "}
            <Link to="/feedback">View all feedback</Link>
          </p>
        )}
      </form>
    </div>
  );
}
