import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import {
  UnifiedInput,
  UnifiedTextarea,
} from "~/components/ui/form-field-unified";

// Mock the hooks and utilities
vi.mock("~/hooks/use-input-state", () => ({
  useInputState: vi.fn(({ initialValue, onChange, validation }) => {
    const [value, setValue] = React.useState(initialValue || "");
    const handleChange = (newValue: string) => {
      setValue(newValue);
      onChange?.(newValue);
    };

    return {
      value,
      error: null,
      warning: null,
      isValid: true,
      isDirty: false,
      isTouched: false,
      handleChange,
      handleBlur: vi.fn(),
      handleFocus: vi.fn(),
      validate: vi.fn(),
      reset: vi.fn(),
      setValue,
    };
  }),
}));

vi.mock("~/lib/ui/input-styles", () => ({
  getInputClasses: vi.fn(({ className }) => {
    const baseClasses = "mock-input-classes";
    return className ? `${baseClasses} ${className}` : baseClasses;
  }),
  INPUT_STYLES: {
    base: "base-styles",
    sizes: {
      sm: "small-styles",
      default: "default-styles",
      lg: "large-styles",
    },
  },
}));

describe("UnifiedInput", () => {
  const defaultProps = {
    "data-testid": "test-input",
  };

  it("should render basic input", () => {
    render(<UnifiedInput {...defaultProps} />);
    expect(screen.getByTestId("test-input")).toBeInTheDocument();
  });

  it("should render with label", () => {
    render(<UnifiedInput {...defaultProps} label="Test Label" />);

    expect(screen.getByText("Test Label")).toBeInTheDocument();
    expect(screen.getByLabelText("Test Label")).toBeInTheDocument();
  });

  it("should show required indicator", () => {
    render(<UnifiedInput {...defaultProps} label="Required Field" required />);

    // Should show asterisk for required fields
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("should display description text", () => {
    const description = "This is a helpful description";
    render(<UnifiedInput {...defaultProps} description={description} />);

    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it("should display error message", () => {
    const errorMessage = "This field is required";
    render(<UnifiedInput {...defaultProps} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("should handle disabled state", () => {
    render(<UnifiedInput {...defaultProps} disabled />);

    const input = screen.getByTestId("test-input");
    expect(input).toBeDisabled();
  });

  it("should handle different sizes", () => {
    const { rerender } = render(<UnifiedInput {...defaultProps} size="sm" />);
    let input = screen.getByTestId("test-input");
    expect(input).toHaveClass("mock-input-classes");

    rerender(<UnifiedInput {...defaultProps} size="lg" />);
    input = screen.getByTestId("test-input");
    expect(input).toHaveClass("mock-input-classes");
  });

  it("should render with icon", () => {
    const icon = <span data-testid="test-icon">🔍</span>;
    render(<UnifiedInput {...defaultProps} icon={icon} />);

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("should handle icon positions", () => {
    const icon = <span data-testid="test-icon">🔍</span>;

    const { rerender } = render(
      <UnifiedInput {...defaultProps} icon={icon} iconPosition="left" />
    );
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();

    rerender(
      <UnifiedInput {...defaultProps} icon={icon} iconPosition="right" />
    );
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("should show clear button when clearable", () => {
    render(
      <UnifiedInput {...defaultProps} clearable defaultValue="test value" />
    );

    // Should show clear button when there's a value
    const clearButton = screen.getByRole("button", { name: /clear/i });
    expect(clearButton).toBeInTheDocument();
  });

  it("should call onChange when value changes", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<UnifiedInput {...defaultProps} onChange={handleChange} />);

    const input = screen.getByTestId("test-input");
    await user.type(input, "test");

    // onChange should be called for each character
    expect(handleChange).toHaveBeenCalled();
  });

  it("should handle validation changes", () => {
    const handleValidationChange = vi.fn();
    const validation = { required: true };

    render(
      <UnifiedInput
        {...defaultProps}
        validation={validation}
        onValidationChange={handleValidationChange}
      />
    );

    // Component should render without errors
    expect(screen.getByTestId("test-input")).toBeInTheDocument();
  });

  it("should forward ref correctly", () => {
    const ref = React.createRef<HTMLInputElement>();

    render(<UnifiedInput {...defaultProps} ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toBe(screen.getByTestId("test-input"));
  });

  it("should support accessibility attributes", () => {
    render(
      <UnifiedInput
        {...defaultProps}
        label="Test Field"
        description="Helper text"
        error="Error message"
        aria-describedby="custom-description"
      />
    );

    const input = screen.getByTestId("test-input");

    // Should have proper ARIA attributes
    expect(input).toHaveAttribute("aria-invalid", "true"); // Due to error
    expect(input).toHaveAccessibleName("Test Field");
  });
});

describe("UnifiedTextarea", () => {
  const defaultProps = {
    "data-testid": "test-textarea",
  };

  it("should render textarea", () => {
    render(<UnifiedTextarea {...defaultProps} />);
    expect(screen.getByTestId("test-textarea")).toBeInTheDocument();
  });

  it("should handle rows and resize", () => {
    render(<UnifiedTextarea {...defaultProps} rows={5} resize="vertical" />);

    const textarea = screen.getByTestId("test-textarea");
    expect(textarea).toHaveAttribute("rows", "5");
  });

  it("should show character count when validation maxLength is provided", () => {
    render(
      <UnifiedTextarea {...defaultProps} validation={{ maxLength: 100 }} />
    );

    expect(screen.getByText(/0\/100/)).toBeInTheDocument();
  });

  it("should update character count on input", async () => {
    const user = userEvent.setup();

    render(
      <UnifiedTextarea {...defaultProps} validation={{ maxLength: 100 }} />
    );

    const textarea = screen.getByTestId("test-textarea");
    await user.type(textarea, "test");

    await waitFor(() => {
      expect(screen.getByText(/4\/100/)).toBeInTheDocument();
    });
  });

  it("should handle resizable textarea", async () => {
    const user = userEvent.setup();

    render(<UnifiedTextarea {...defaultProps} resizable />);

    const textarea = screen.getByTestId("test-textarea");

    // Add multiple lines of text
    await user.type(textarea, "Line 1\nLine 2\nLine 3");

    // Component should have resizable class
    expect(textarea).toHaveClass("resize-y");
  });

  it("should forward ref correctly", () => {
    const ref = React.createRef<HTMLTextAreaElement>();

    render(<UnifiedTextarea {...defaultProps} ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});

// UnifiedSelect tests removed as component doesn't exist in the codebase

describe("Form Field Integration", () => {
  it("should work together in a form", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    const TestForm = () => (
      <form onSubmit={handleSubmit} data-testid="test-form">
        <UnifiedInput label="Name" required data-testid="name-input" />
        <UnifiedTextarea
          label="Description"
          data-testid="description-textarea"
        />
        <button type="submit">Submit</button>
      </form>
    );

    render(<TestForm />);

    // Should render all form fields
    expect(screen.getByTestId("name-input")).toBeInTheDocument();
    expect(screen.getByTestId("description-textarea")).toBeInTheDocument();

    // Should be able to interact with fields
    await user.type(screen.getByTestId("name-input"), "Test Name");
    await user.type(
      screen.getByTestId("description-textarea"),
      "Test Description"
    );

    // Fields should work together in form context
    expect(screen.getByDisplayValue("Test Name")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
  });
});
