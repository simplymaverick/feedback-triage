import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FeedbackListPage } from "./FeedbackListPage";
import * as client from "../api/client";

function renderListPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <FeedbackListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("FeedbackListPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("refetches when sentiment filter changes", async () => {
    const user = userEvent.setup();
    const listSpy = vi.spyOn(client.api, "listFeedback").mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 10,
      total: 0,
    });

    renderListPage();

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalled();
    });

    const select = screen.getByRole("combobox", { name: /sentiment/i });
    await user.selectOptions(select, "positive");

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sentiment: "positive",
          page: 1,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
      );
    });
  });

  it("refetches when search query changes", async () => {
    const user = userEvent.setup();
    const listSpy = vi.spyOn(client.api, "listFeedback").mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 10,
      total: 0,
    });

    renderListPage();

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalled();
    });

    const searchInput = screen.getByRole("searchbox", {
      name: /search feedback text or summary/i,
    });
    await user.type(searchInput, "checkout");

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "checkout",
          page: 1,
        }),
      );
    });
  });
});
