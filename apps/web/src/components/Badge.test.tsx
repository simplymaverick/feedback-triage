import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders label text", () => {
    render(<Badge label="positive" variant="positive" />);
    expect(screen.getByText("positive")).toBeInTheDocument();
  });

  it("applies priority variant class", () => {
    const { container } = render(<Badge label="P0" variant="P0" />);
    expect(container.firstChild).toHaveClass("badge--p0");
  });
});
