import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TagList } from "./TagList";

describe("TagList", () => {
  it("renders tags as badges", () => {
    render(<TagList tags={["ux", "bug"]} />);
    expect(screen.getByText("ux")).toBeInTheDocument();
    expect(screen.getByText("bug")).toBeInTheDocument();
  });

  it("shows placeholder when empty", () => {
    render(<TagList tags={[]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
