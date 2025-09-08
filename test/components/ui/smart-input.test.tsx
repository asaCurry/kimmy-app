import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { SmartInput } from "~/components/ui/smart-input";
import type { FieldSuggestions } from "~/lib/auto-completion-service";

// Mock Badge component
vi.mock("~/components/ui/badge", () => ({
  Badge: ({ children, className, variant }: any) => (
    <span className={`badge ${variant} ${className}`}>{children}</span>
  ),
}));

const mockSuggestions: FieldSuggestions = {
  recent: [
    {
      value: "apple",
      frequency: 2,
      lastUsed: new Date("2023-12-01"),
      context: { memberId: 1, memberName: "John", timeOfDay: "morning" },
    },
    {
      value: "banana",
      frequency: 1,
      lastUsed: new Date("2023-11-30"),
      context: { memberId: 2, memberName: "Jane", timeOfDay: "afternoon" },
    },
  ],
  frequent: [
    {
      value: "cherry",
      frequency: 5,
      lastUsed: new Date("2023-11-29"),
      context: { memberId: 1, memberName: "John", timeOfDay: "evening" },
    },
  ],
  contextual: [
    {
      value: "date",
      frequency: 3,
      lastUsed: new Date("2023-11-28"),
      context: { memberId: 1, memberName: "John", timeOfDay: "morning" },
    },
  ],
};

describe("SmartInput", () => {
  const defaultProps = {
    placeholder: "Enter value",
    value: "",
    onChange: vi.fn(),
    onSelectSuggestion: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without suggestions", () => {
    render(<SmartInput {...defaultProps} />);

    const input = screen.getByPlaceholderText("Enter value");
    expect(input).toBeInTheDocument();
  });

  it("shows label when provided", () => {
    render(<SmartInput {...defaultProps} label="Test Label" />);

    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("shows error message when provided", () => {
    render(<SmartInput {...defaultProps} error="Test error" />);

    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("shows loading spinner when loading", () => {
    render(<SmartInput {...defaultProps} isLoading={true} />);

    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("displays suggestions dropdown on focus", async () => {
    render(<SmartInput {...defaultProps} suggestions={mockSuggestions} />);

    const input = screen.getByPlaceholderText("Enter value");
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText("apple")).toBeInTheDocument();
      expect(screen.getByText("banana")).toBeInTheDocument();
      expect(screen.getByText("cherry")).toBeInTheDocument();
      expect(screen.getByText("date")).toBeInTheDocument();
    });
  });

  it("hides suggestions dropdown on blur", async () => {
    render(<SmartInput {...defaultProps} suggestions={mockSuggestions} />);

    const input = screen.getByPlaceholderText("Enter value");
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText("apple")).toBeInTheDocument();
    });

    fireEvent.blur(input);

    await waitFor(
      () => {
        expect(screen.queryByText("apple")).not.toBeInTheDocument();
      },
      { timeout: 200 }
    );
  });

  it("filters suggestions based on input value", async () => {
    const user = userEvent.setup();
    render(
      <SmartInput {...defaultProps} suggestions={mockSuggestions} value="a" />
    );

    const input = screen.getByPlaceholderText("Enter value");
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText("apple")).toBeInTheDocument();
      expect(screen.getByText("banana")).toBeInTheDocument();
      expect(screen.getByText("date")).toBeInTheDocument();
      expect(screen.queryByText("cherry")).not.toBeInTheDocument();
    });
  });

  it("calls onSelectSuggestion when suggestion is clicked", async () => {
    const user = userEvent.setup();
    const onSelectSuggestion = vi.fn();

    render(
      <SmartInput
        {...defaultProps}
        suggestions={mockSuggestions}
        onSelectSuggestion={onSelectSuggestion}
      />
    );

    const input = screen.getByPlaceholderText("Enter value");
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText("apple")).toBeInTheDocument();
    });

    await user.click(screen.getByText("apple"));

    expect(onSelectSuggestion).toHaveBeenCalledWith(mockSuggestions.recent[0]);
  });

  it("handles keyboard navigation", async () => {
    const user = userEvent.setup();
    const onSelectSuggestion = vi.fn();

    render(
      <SmartInput
        {...defaultProps}
        suggestions={mockSuggestions}
        onSelectSuggestion={onSelectSuggestion}
      />
    );

    const input = screen.getByPlaceholderText("Enter value");
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText("apple")).toBeInTheDocument();
    });

    // Navigate down and select with Enter
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(onSelectSuggestion).toHaveBeenCalledWith(mockSuggestions.recent[0]);
  });

  it("closes dropdown on Escape key", async () => {
    const user = userEvent.setup();
    render(<SmartInput {...defaultProps} suggestions={mockSuggestions} />);

    const input = screen.getByPlaceholderText("Enter value");
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText("apple")).toBeInTheDocument();
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByText("apple")).not.toBeInTheDocument();
    });
  });

  it("displays suggestion categories correctly", async () => {
    const user = userEvent.setup();
    render(<SmartInput {...defaultProps} suggestions={mockSuggestions} />);

    const input = screen.getByPlaceholderText("Enter value");
    await user.click(input);

    await waitFor(() => {
      expect(screen.getAllByText("Recent").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Frequent").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Contextual").length).toBeGreaterThan(0);
    });
  });

  it("displays frequency badges for suggestions with frequency > 1", async () => {
    const user = userEvent.setup();
    render(<SmartInput {...defaultProps} suggestions={mockSuggestions} />);

    const input = screen.getByPlaceholderText("Enter value");
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText("2x")).toBeInTheDocument(); // apple
      expect(screen.getByText("5x")).toBeInTheDocument(); // cherry
      expect(screen.getByText("3x")).toBeInTheDocument(); // date
      expect(screen.queryByText("1x")).not.toBeInTheDocument(); // banana
    });
  });

  it("displays member name badges when available", async () => {
    const user = userEvent.setup();
    render(<SmartInput {...defaultProps} suggestions={mockSuggestions} />);

    const input = screen.getByPlaceholderText("Enter value");
    await user.click(input);

    await waitFor(() => {
      expect(screen.getAllByText("John").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Jane").length).toBeGreaterThan(0);
    });
  });

  it.skip("toggles dropdown when chevron button is clicked", async () => {
    const user = userEvent.setup();
    render(<SmartInput {...defaultProps} suggestions={mockSuggestions} />);

    // Find chevron button using more specific selector
    const chevronButton = screen.getByRole("button");
    expect(chevronButton).toBeInTheDocument();

    // Initially suggestions should not be visible
    expect(screen.queryByText("apple")).not.toBeInTheDocument();

    // Click chevron to open
    await user.click(chevronButton);

    await waitFor(
      () => {
        expect(screen.getByText("apple")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Click chevron again to close (with slight delay)
    await new Promise(resolve => setTimeout(resolve, 100));
    await user.click(chevronButton);

    await waitFor(
      () => {
        expect(screen.queryByText("apple")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("limits suggestions to 8 items", async () => {
    const manySuggestions: FieldSuggestions = {
      recent: Array.from({ length: 5 }, (_, i) => ({
        value: `recent-${i}`,
        frequency: 1,
        lastUsed: new Date(),
      })),
      frequent: Array.from({ length: 5 }, (_, i) => ({
        value: `frequent-${i}`,
        frequency: 2,
        lastUsed: new Date(),
      })),
      contextual: Array.from({ length: 5 }, (_, i) => ({
        value: `contextual-${i}`,
        frequency: 1,
        lastUsed: new Date(),
      })),
    };

    const user = userEvent.setup();
    render(<SmartInput {...defaultProps} suggestions={manySuggestions} />);

    const input = screen.getByPlaceholderText("Enter value");
    await user.click(input);

    await waitFor(() => {
      const suggestionButtons = screen
        .getAllByRole("button")
        .filter(button => button.textContent?.includes("-"));
      expect(suggestionButtons).toHaveLength(8);
    });
  });

  it("handles empty suggestions gracefully", () => {
    const emptySuggestions: FieldSuggestions = {
      recent: [],
      frequent: [],
      contextual: [],
    };

    render(<SmartInput {...defaultProps} suggestions={emptySuggestions} />);

    const input = screen.getByPlaceholderText("Enter value");
    fireEvent.focus(input);

    // Should not show dropdown when no suggestions
    expect(screen.queryByText("No suggestions found")).not.toBeInTheDocument();
  });

  it("does not show suggestions when showSuggestions is false", async () => {
    const user = userEvent.setup();
    render(
      <SmartInput
        {...defaultProps}
        suggestions={mockSuggestions}
        showSuggestions={false}
      />
    );

    const input = screen.getByPlaceholderText("Enter value");
    await user.click(input);

    expect(screen.queryByText("apple")).not.toBeInTheDocument();
  });
});
