import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SubmitPage } from "./SubmitPage";
import * as client from "../api/client";

function renderSubmitPage() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SubmitPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SubmitPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("submits feedback and shows success message", async () => {
    const user = userEvent.setup();
    vi.spyOn(client.api, "createFeedback").mockResolvedValue({
      id: "test-id",
      text: "Great app",
      email: null,
      createdAt: new Date().toISOString(),
      analysis: {
        summary: "Positive feedback",
        sentiment: "positive",
        tags: ["ux"],
        priority: "P3",
        nextAction: "Share with team",
      },
    });

    renderSubmitPage();

    await user.type(
      screen.getByRole("textbox", { name: /feedback/i }),
      "Great app, love the design!",
    );
    await user.click(screen.getByRole("button", { name: /submit feedback/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/submitted successfully/i);
    });
    expect(client.api.createFeedback).toHaveBeenCalledWith({
      text: "Great app, love the design!",
    });
  });

  it("shows error when submission fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(client.api, "createFeedback").mockRejectedValue(new Error("Server error"));

    renderSubmitPage();

    await user.type(screen.getByRole("textbox", { name: /feedback/i }), "Something broke");
    await user.click(screen.getByRole("button", { name: /submit feedback/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Server error");
    });
  });
});
