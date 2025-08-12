import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DataUploadHub from "../DataUploadHub";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ orgNumber: "123" }),
  };
});

describe("DataUploadHub", () => {
  it("navigates to SAF-T import when clicking saft button", () => {
    render(<DataUploadHub />);
    fireEvent.click(screen.getByRole("button", { name: /last opp saf-t import/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/klienter/123/saft");
  });
});
