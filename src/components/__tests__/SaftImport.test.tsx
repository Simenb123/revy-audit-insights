import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import SaftImport from "../SaftImport";

describe("SaftImport", () => {
  it("shows selected file name", () => {
    render(<SaftImport />);
    const file = new File(["content"], "test.xml", { type: "text/xml" });
    fireEvent.change(screen.getByTestId("saft-input"), {
      target: { files: [file] },
    });
    expect(screen.getByText(/test.xml/)).toBeInTheDocument();
  });
});
