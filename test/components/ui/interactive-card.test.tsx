import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import {
  InteractiveCard,
  IconCard,
  AddCard,
} from "~/components/ui/interactive-card";

// Mock the icons
vi.mock("lucide-react", () => ({
  ChevronRight: () => <div data-testid="chevron-right">→</div>,
}));

// Mock the utils
vi.mock("~/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

describe("InteractiveCard Components", () => {
  describe("InteractiveCard", () => {
    it("should render basic interactive card", () => {
      render(
        <InteractiveCard data-testid="test-card">Card content</InteractiveCard>
      );

      const card = screen.getByTestId("test-card");
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent("Card content");
    });

    it("should apply default variant styling", () => {
      render(<InteractiveCard data-testid="test-card" />);

      const card = screen.getByTestId("test-card");
      expect(card).toHaveClass("cursor-pointer", "transition-all");
    });

    it("should apply dashed variant styling", () => {
      render(<InteractiveCard variant="dashed" data-testid="test-card" />);

      const card = screen.getByTestId("test-card");
      expect(card).toHaveClass("cursor-pointer", "border-dashed", "border-2");
    });

    it("should handle click events", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <InteractiveCard onClick={handleClick} data-testid="test-card">
          Click me
        </InteractiveCard>
      );

      const card = screen.getByTestId("test-card");
      await user.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should be keyboard accessible when clickable", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <InteractiveCard onClick={handleClick} data-testid="test-card">
          Press me
        </InteractiveCard>
      );

      const card = screen.getByTestId("test-card");

      // Should be focusable
      await user.tab();
      expect(card).toHaveFocus();

      // Should respond to Enter key
      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Should respond to Space key
      await user.keyboard(" ");
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it("should have button role when clickable", () => {
      render(
        <InteractiveCard onClick={() => {}} data-testid="test-card">
          Button card
        </InteractiveCard>
      );

      const card = screen.getByTestId("test-card");
      expect(card).toHaveAttribute("role", "button");
      expect(card).toHaveAttribute("tabIndex", "0");
    });

    it("should not have button role when not clickable", () => {
      render(
        <InteractiveCard data-testid="test-card">Static card</InteractiveCard>
      );

      const card = screen.getByTestId("test-card");
      expect(card).not.toHaveAttribute("role", "button");
      expect(card).not.toHaveAttribute("tabIndex");
    });

    it("should call custom onKeyDown handler", async () => {
      const handleClick = vi.fn();
      const handleKeyDown = vi.fn();
      const user = userEvent.setup();

      render(
        <InteractiveCard
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          data-testid="test-card"
        >
          Card with custom handler
        </InteractiveCard>
      );

      const card = screen.getByTestId("test-card");
      await user.tab();
      await user.keyboard("{Enter}");

      expect(handleKeyDown).toHaveBeenCalled();
      expect(handleClick).toHaveBeenCalled();
    });

    it("should respond to Enter and Space keys", () => {
      const handleClick = vi.fn();

      render(
        <InteractiveCard onClick={handleClick} data-testid="test-card">
          Card content
        </InteractiveCard>
      );

      const card = screen.getByTestId("test-card");

      // Test Enter key
      fireEvent.keyDown(card, { key: "Enter" });
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Test Space key
      fireEvent.keyDown(card, { key: " " });
      expect(handleClick).toHaveBeenCalledTimes(2);

      // Test that other keys don't trigger click
      fireEvent.keyDown(card, { key: "Escape" });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe("IconCard", () => {
    const mockIcon = <div data-testid="mock-icon">📄</div>;

    it("should render icon card with all props", () => {
      render(
        <IconCard
          icon={mockIcon}
          title="Test Card"
          description="Test description"
          data-testid="icon-card"
        />
      );

      expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
      expect(screen.getByText("Test Card")).toBeInTheDocument();
      expect(screen.getByText("Test description")).toBeInTheDocument();
      expect(screen.getByTestId("chevron-right")).toBeInTheDocument();
    });

    it("should render without description", () => {
      render(
        <IconCard icon={mockIcon} title="Title Only" data-testid="icon-card" />
      );

      expect(screen.getByText("Title Only")).toBeInTheDocument();
      expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
    });

    it("should hide chevron when showChevron is false", () => {
      render(
        <IconCard
          icon={mockIcon}
          title="No Chevron"
          showChevron={false}
          data-testid="icon-card"
        />
      );

      expect(screen.queryByTestId("chevron-right")).not.toBeInTheDocument();
    });

    it("should apply dashed variant", () => {
      render(
        <IconCard
          icon={mockIcon}
          title="Dashed Card"
          variant="dashed"
          data-testid="icon-card"
        />
      );

      const card = screen.getByTestId("icon-card");
      expect(card).toHaveClass("border-dashed");
    });

    it("should handle click events", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <IconCard
          icon={mockIcon}
          title="Clickable Card"
          onClick={handleClick}
          data-testid="icon-card"
        />
      );

      const card = screen.getByTestId("icon-card");
      await user.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should have proper responsive layout", () => {
      render(
        <IconCard
          icon={mockIcon}
          title="Responsive Card"
          description="Responsive description"
          data-testid="icon-card"
        />
      );

      const cardHeader = screen
        .getByTestId("icon-card")
        .querySelector(".flex.items-center.justify-between");
      expect(cardHeader).toBeInTheDocument();

      const titleElement = screen.getByText("Responsive Card");
      expect(titleElement).toHaveClass("text-lg", "sm:text-xl", "truncate");
    });

    it("should truncate long titles", () => {
      const longTitle = "This is a very long title that should be truncated";

      render(
        <IconCard icon={mockIcon} title={longTitle} data-testid="icon-card" />
      );

      const titleElement = screen.getByText(longTitle);
      expect(titleElement).toHaveClass("truncate");
    });

    it("should limit description to 2 lines", () => {
      const longDescription =
        "This is a very long description that should be limited to two lines and then truncated with ellipsis";

      render(
        <IconCard
          icon={mockIcon}
          title="Title"
          description={longDescription}
          data-testid="icon-card"
        />
      );

      const descriptionElement = screen.getByText(longDescription);
      expect(descriptionElement).toHaveClass("line-clamp-2");
    });
  });

  describe("AddCard", () => {
    it("should render add card with title", () => {
      render(<AddCard title="Add New Item" data-testid="add-card" />);

      expect(screen.getByText("Add New Item")).toBeInTheDocument();
      expect(screen.getByText("➕")).toBeInTheDocument();
    });

    it("should render with description", () => {
      render(
        <AddCard
          title="Add New Item"
          description="Click to create"
          data-testid="add-card"
        />
      );

      expect(screen.getByText("Add New Item")).toBeInTheDocument();
      expect(screen.getByText("Click to create")).toBeInTheDocument();
    });

    it("should always use dashed variant", () => {
      render(<AddCard title="Add Card" data-testid="add-card" />);

      const card = screen.getByTestId("add-card");
      expect(card).toHaveClass("border-dashed");
    });

    it("should handle click events", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <AddCard title="Add New" onClick={handleClick} data-testid="add-card" />
      );

      const card = screen.getByTestId("add-card");
      await user.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should have centered layout", () => {
      render(
        <AddCard
          title="Centered Card"
          description="Centered description"
          data-testid="add-card"
        />
      );

      const cardContent = screen
        .getByTestId("add-card")
        .querySelector(
          ".flex.flex-col.sm\\:flex-row.items-center.justify-center"
        );
      expect(cardContent).toBeInTheDocument();
    });

    it("should have gradient plus icon", () => {
      render(<AddCard title="Add Item" data-testid="add-card" />);

      const plusIcon = screen.getByText("➕");
      expect(plusIcon).toHaveClass(
        "bg-gradient-to-r",
        "from-blue-500",
        "to-purple-600"
      );
    });

    it("should be keyboard accessible", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <AddCard
          title="Add Item"
          onClick={handleClick}
          data-testid="add-card"
        />
      );

      const card = screen.getByTestId("add-card");

      await user.tab();
      expect(card).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("should support ARIA attributes on InteractiveCard", () => {
      render(
        <InteractiveCard
          onClick={() => {}}
          aria-label="Interactive card"
          aria-describedby="card-description"
          data-testid="accessible-card"
        >
          <p id="card-description">Card description</p>
        </InteractiveCard>
      );

      const card = screen.getByTestId("accessible-card");
      expect(card).toHaveAttribute("aria-label", "Interactive card");
      expect(card).toHaveAttribute("aria-describedby", "card-description");
    });

    it("should support ARIA attributes on IconCard", () => {
      const mockIcon = <div data-testid="mock-icon">📄</div>;

      render(
        <IconCard
          icon={mockIcon}
          title="Accessible Icon Card"
          onClick={() => {}}
          aria-label="Custom aria label"
          data-testid="accessible-icon-card"
        />
      );

      const card = screen.getByTestId("accessible-icon-card");
      expect(card).toHaveAttribute("aria-label", "Custom aria label");
    });

    it("should support ARIA attributes on AddCard", () => {
      render(
        <AddCard
          title="Add Item"
          onClick={() => {}}
          aria-label="Add new item button"
          data-testid="accessible-add-card"
        />
      );

      const card = screen.getByTestId("accessible-add-card");
      expect(card).toHaveAttribute("aria-label", "Add new item button");
    });
  });

  describe("Responsive Design", () => {
    it("should have responsive classes on InteractiveCard", () => {
      render(<InteractiveCard data-testid="responsive-card" />);

      const card = screen.getByTestId("responsive-card");
      expect(card).toHaveClass("hover:scale-[1.02]", "sm:hover:scale-105");
    });

    it("should have responsive text sizes on IconCard", () => {
      const mockIcon = <div>📄</div>;

      render(
        <IconCard
          icon={mockIcon}
          title="Responsive Title"
          description="Responsive description"
        />
      );

      const titleElement = screen.getByText("Responsive Title");
      expect(titleElement).toHaveClass("text-lg", "sm:text-xl");
    });

    it("should have responsive layout on AddCard", () => {
      render(
        <AddCard title="Responsive Add" description="Responsive description" />
      );

      const plusIcon = screen.getByText("➕");
      expect(plusIcon).toHaveClass("text-2xl", "sm:text-3xl");
    });
  });

  describe("Integration", () => {
    it("should work with form submission", async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <form onSubmit={handleSubmit}>
          <IconCard
            icon={<div>📋</div>}
            title="Form Card"
            onClick={() => handleSubmit()}
            data-testid="form-card"
          />
        </form>
      );

      const card = screen.getByTestId("form-card");
      await user.click(card);

      expect(handleSubmit).toHaveBeenCalled();
    });

    it("should work in grid layouts", () => {
      const mockIcon = <div>📄</div>;

      render(
        <div className="grid grid-cols-2 gap-4" data-testid="card-grid">
          <IconCard icon={mockIcon} title="Card 1" />
          <IconCard icon={mockIcon} title="Card 2" />
          <AddCard title="Add More" />
        </div>
      );

      const grid = screen.getByTestId("card-grid");
      expect(grid).toBeInTheDocument();
      expect(screen.getByText("Card 1")).toBeInTheDocument();
      expect(screen.getByText("Card 2")).toBeInTheDocument();
      expect(screen.getByText("Add More")).toBeInTheDocument();
    });

    it("should handle loading states", () => {
      const LoadingCard = ({ isLoading }: { isLoading: boolean }) => (
        <IconCard
          icon={isLoading ? <div>⏳</div> : <div>✅</div>}
          title={isLoading ? "Loading..." : "Loaded"}
          description={isLoading ? "Please wait" : "Ready to use"}
        />
      );

      const { rerender } = render(<LoadingCard isLoading={true} />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(screen.getByText("Please wait")).toBeInTheDocument();

      rerender(<LoadingCard isLoading={false} />);

      expect(screen.getByText("Loaded")).toBeInTheDocument();
      expect(screen.getByText("Ready to use")).toBeInTheDocument();
    });
  });
});
