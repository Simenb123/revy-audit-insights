import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SaftImport from "../SaftImport";

const toast = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast }),
}));

describe("SaftImport", () => {
  it("shows selected file name", () => {
    render(<SaftImport />);
    const file = new File(["content"], "test.xml", { type: "text/xml" });
    fireEvent.change(screen.getByTestId("saft-input"), {
      target: { files: [file] },
    });
    expect(screen.getByText(/test.xml/)).toBeInTheDocument();
  });

  it("shows error for invalid file type", () => {
    render(<SaftImport />);
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    fireEvent.change(screen.getByTestId("saft-input"), {
      target: { files: [file] },
    });
    expect(toast).toHaveBeenCalled();
    expect(screen.queryByText(/test.txt/)).not.toBeInTheDocument();
  });

  it("shows error for oversized file", () => {
    render(<SaftImport />);
    const bigContent = new Uint8Array(5_000_001);
    const file = new File([bigContent], "big.xml", { type: "text/xml" });
    fireEvent.change(screen.getByTestId("saft-input"), {
      target: { files: [file] },
    });
    expect(toast).toHaveBeenCalled();
    expect(screen.queryByText(/big.xml/)).not.toBeInTheDocument();
  });
});
