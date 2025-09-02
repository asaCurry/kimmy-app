import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { Input } from "~/components/ui/input";

// Mock the unified components
vi.mock("~/components/ui/form-field-unified", () => ({
  UnifiedInput: React.forwardRef<HTMLInputElement, any>(
    ({ onChange, error, className, icon, ...props }, ref) => (
      <div className="unified-input-wrapper">
        {icon && <span data-testid="input-icon">{icon}</span>}
        <input
          ref={ref}
          className={`mock-unified-input ${className || ""}`}
          onChange={e => onChange?.(e.target.value)}
          {...props}
        />
        {error && <span data-testid="error-message">{error}</span>}
      </div>
    )
  ),
  UnifiedTextarea: React.forwardRef<HTMLTextAreaElement, any>((props, ref) => (
    <textarea ref={ref} {...props} />
  )),
}));

describe("Legacy Input Component", () => {
  describe("Basic Functionality", () => {
    it("should render input field", () => {
      render(<Input placeholder="Enter text" data-testid="legacy-input" />);

      const input = screen.getByTestId("legacy-input");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("placeholder", "Enter text");
    });

    it("should forward ref correctly", () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} data-testid="ref-input" />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it("should apply custom className", () => {
      render(<Input className="custom-class" data-testid="class-input" />);

      const input = screen.getByTestId("class-input");
      expect(input).toHaveClass("mock-unified-input", "custom-class");
    });
  });

  describe("State Props", () => {
    it("should handle error state", () => {
      render(<Input error={true} data-testid="error-input" />);

      const errorMessage = screen.getByTestId("error-message");
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent("This field has an error");
    });

    it("should handle success state", () => {
      render(<Input success={true} data-testid="success-input" />);

      const input = screen.getByTestId("success-input");
      expect(input).toBeInTheDocument();
      // Success state is handled internally by UnifiedInput
    });

    it("should prioritize error over success", () => {
      render(<Input error={true} success={true} data-testid="mixed-input" />);

      const errorMessage = screen.getByTestId("error-message");
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent("This field has an error");
    });
  });

  describe("Icon Support", () => {
    it("should render with icon", () => {
      const icon = <span>🔍</span>;
      render(<Input icon={icon} data-testid="icon-input" />);

      const iconElement = screen.getByTestId("input-icon");
      expect(iconElement).toBeInTheDocument();
      expect(iconElement).toHaveTextContent("🔍");
    });

    it("should render without icon when not provided", () => {
      render(<Input data-testid="no-icon-input" />);

      const iconElement = screen.queryByTestId("input-icon");
      expect(iconElement).not.toBeInTheDocument();
    });
  });

  describe("Change Handling", () => {
    it("should handle onChange events", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input onChange={handleChange} data-testid="change-input" />);

      const input = screen.getByTestId("change-input");
      await user.type(input, "test text");

      expect(handleChange).toHaveBeenCalled();
      // The mock converts string to event format
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ value: expect.any(String) }),
        })
      );
    });

    it("should convert UnifiedInput string onChange to event format", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(<Input onChange={handleChange} data-testid="convert-input" />);

      const input = screen.getByTestId("convert-input");
      await user.type(input, "a");

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({ value: "a" }),
        })
      );
    });
  });

  describe("HTML Input Attributes", () => {
    it("should support standard input attributes", () => {
      render(
        <Input
          type="email"
          required
          disabled
          maxLength={50}
          data-testid="attrs-input"
        />
      );

      const input = screen.getByTestId("attrs-input");
      expect(input).toHaveAttribute("type", "email");
      expect(input).toHaveAttribute("required");
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute("maxLength", "50");
    });

    it("should support value prop", () => {
      render(<Input value="initial value" data-testid="value-input" />);

      const input = screen.getByTestId("value-input") as HTMLInputElement;
      expect(input.value).toBe("initial value");
    });

    it("should support defaultValue prop", () => {
      render(<Input defaultValue="default text" data-testid="default-input" />);

      const input = screen.getByTestId("default-input") as HTMLInputElement;
      expect(input.value).toBe("default text");
    });
  });

  describe("Integration", () => {
    it("should work in forms", () => {
      const handleSubmit = vi.fn(e => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <Input name="username" data-testid="form-input" />
          <button type="submit">Submit</button>
        </form>
      );

      const input = screen.getByTestId("form-input");
      expect(input).toHaveAttribute("name", "username");
    });

    it("should maintain backward compatibility with old Input usage", () => {
      // Test that old Input API still works
      render(
        <Input
          error={false}
          success={true}
          icon={<span data-testid="search-icon">🔍</span>}
          placeholder="Legacy input"
          data-testid="legacy-compat"
        />
      );

      const input = screen.getByTestId("legacy-compat");
      const icon = screen.getByTestId("search-icon");

      expect(input).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
      expect(input).toHaveAttribute("placeholder", "Legacy input");
    });

    it("should delegate complex functionality to UnifiedInput", () => {
      // The legacy Input is just a wrapper, so we verify it passes props correctly
      render(
        <Input
          className="custom"
          placeholder="Unified delegation test"
          data-testid="delegation-test"
        />
      );

      const input = screen.getByTestId("delegation-test");
      expect(input).toHaveClass("mock-unified-input", "custom");
      expect(input).toHaveAttribute("placeholder", "Unified delegation test");
    });
  });

  describe("Error Scenarios", () => {
    it("should handle missing onChange gracefully", () => {
      render(<Input data-testid="no-change-input" />);

      const input = screen.getByTestId("no-change-input");
      expect(input).toBeInTheDocument();

      // Should not throw when typing without onChange handler
      expect(() => {
        input.focus();
      }).not.toThrow();
    });

    it("should handle undefined error prop", () => {
      render(<Input error={undefined} data-testid="undefined-error" />);

      const input = screen.getByTestId("undefined-error");
      expect(input).toBeInTheDocument();

      const errorMessage = screen.queryByTestId("error-message");
      expect(errorMessage).not.toBeInTheDocument();
    });

    it("should handle falsy success prop", () => {
      render(<Input success={false} data-testid="false-success" />);

      const input = screen.getByTestId("false-success");
      expect(input).toBeInTheDocument();
    });
  });
});
