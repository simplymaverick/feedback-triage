import { describe, it, expect } from "vitest";
import {
  analysisSchema,
  createFeedbackSchema,
  listFeedbackQuerySchema,
} from "../src/schemas/feedback.js";

describe("feedback schemas", () => {
  it("createFeedbackSchema accepts valid input", () => {
    const result = createFeedbackSchema.safeParse({
      text: "Hello",
      email: "a@b.com",
    });
    expect(result.success).toBe(true);
  });

  it("createFeedbackSchema rejects empty text", () => {
    const result = createFeedbackSchema.safeParse({ text: "" });
    expect(result.success).toBe(false);
  });

  it("listFeedbackQuerySchema applies defaults", () => {
    const result = listFeedbackQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
      expect(result.data.sortBy).toBe("createdAt");
      expect(result.data.sortOrder).toBe("desc");
    }
  });

  it("analysisSchema rejects invalid sentiment", () => {
    const result = analysisSchema.safeParse({
      summary: "x",
      sentiment: "happy",
      tags: ["a"],
      priority: "P3",
      nextAction: "y",
    });
    expect(result.success).toBe(false);
  });
});
