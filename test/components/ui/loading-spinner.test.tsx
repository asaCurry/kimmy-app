import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { LoadingSpinner } from "~/components/ui/loading-spinner";

describe("LoadingSpinner", () => {
  it("should render with default props", () => {
    render(<LoadingSpinner />);

    // Should have the spinning element
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
  });

  it("should render with text", () => {
    const text = "Loading data...";
    render(<LoadingSpinner text={text} />);

    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("should apply different sizes", () => {
    const { rerender } = render(
      <LoadingSpinner size="sm" data-testid="spinner" />
    );

    // Check for small size classes
    let spinnerElement = screen.getByTestId("spinner-spinner");
    expect(spinnerElement).toHaveClass("h-6", "w-6");

    rerender(<LoadingSpinner size="md" data-testid="spinner" />);
    spinnerElement = screen.getByTestId("spinner-spinner");
    expect(spinnerElement).toHaveClass("h-8", "w-8");

    rerender(<LoadingSpinner size="lg" data-testid="spinner" />);
    spinnerElement = screen.getByTestId("spinner-spinner");
    expect(spinnerElement).toHaveClass("h-12", "w-12");
  });

  it("should apply custom color", () => {
    render(<LoadingSpinner color="border-red-500" data-testid="spinner" />);

    const spinnerElement = screen.getByTestId("spinner-spinner");
    expect(spinnerElement).toHaveClass("border-red-500");
  });

  it("should apply custom className", () => {
    const customClass = "custom-spinner-class";
    render(<LoadingSpinner className={customClass} data-testid="spinner" />);

    const container = screen.getByTestId("spinner");
    expect(container).toHaveClass(customClass);
  });

  it("should have proper animation classes", () => {
    render(<LoadingSpinner data-testid="spinner" />);

    const spinnerElement = screen.getByTestId("spinner-spinner");

    expect(spinnerElement).toHaveClass("animate-spin");
    expect(spinnerElement).toHaveClass("rounded-full");
    expect(spinnerElement).toHaveClass("border-b-2");
  });

  it("should be accessible", () => {
    render(<LoadingSpinner text="Loading content" />);

    // Should have appropriate ARIA attributes for screen readers
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();

    // Text should be visible to screen readers
    expect(screen.getByText("Loading content")).toBeInTheDocument();
  });

  it("should render without text when not provided", () => {
    render(<LoadingSpinner data-testid="spinner" />);

    const container = screen.getByTestId("spinner");
    const textElement = container.querySelector("p");
    expect(textElement).not.toBeInTheDocument();
  });

  it("should center content properly", () => {
    render(<LoadingSpinner data-testid="spinner" />);

    const container = screen.getByTestId("spinner");
    expect(container).toHaveClass("flex", "items-center", "justify-center");

    const innerContainer = container.querySelector(".text-center");
    expect(innerContainer).toBeInTheDocument();
  });

  it("should handle all size variants", () => {
    const sizes: Array<"sm" | "md" | "lg"> = ["sm", "md", "lg"];
    const expectedClasses = {
      sm: ["h-6", "w-6"],
      md: ["h-8", "w-8"],
      lg: ["h-12", "w-12"],
    };

    sizes.forEach(size => {
      const { unmount } = render(
        <LoadingSpinner size={size} data-testid={`spinner-${size}`} />
      );

      const container = screen.getByTestId(`spinner-${size}`);
      const spinnerElement = container.querySelector(".animate-spin");

      expectedClasses[size].forEach(className => {
        expect(spinnerElement).toHaveClass(className);
      });

      unmount();
    });
  });

  it("should work as loading state indicator", async () => {
    const LoadingComponent = ({ isLoading }: { isLoading: boolean }) => (
      <div data-testid="content">
        {isLoading ? (
          <LoadingSpinner text="Loading..." />
        ) : (
          <div>Content loaded</div>
        )}
      </div>
    );

    const { rerender } = render(<LoadingComponent isLoading={true} />);

    // Should show loading spinner
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Content loaded")).not.toBeInTheDocument();

    rerender(<LoadingComponent isLoading={false} />);

    // Should show content and hide spinner
    expect(screen.getByText("Content loaded")).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
});
