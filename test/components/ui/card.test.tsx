import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card";

// Mock the icons
vi.mock("lucide-react", () => ({
  ChevronRight: () => <div data-testid="chevron-right">→</div>,
}));

describe("Card Components", () => {
  describe("Card", () => {
    it("should render basic card", () => {
      render(<Card data-testid="test-card">Card content</Card>);

      const card = screen.getByTestId("test-card");
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent("Card content");
    });

    it("should apply custom className", () => {
      const customClass = "custom-card-class";
      render(<Card className={customClass} data-testid="test-card" />);

      const card = screen.getByTestId("test-card");
      expect(card).toHaveClass(customClass);
    });

    it("should forward ref correctly", () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref} data-testid="test-card" />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toBe(screen.getByTestId("test-card"));
    });

    it("should have default card styling", () => {
      render(<Card data-testid="test-card" />);

      const card = screen.getByTestId("test-card");
      expect(card).toHaveClass("rounded-lg", "border", "bg-card", "shadow-sm");
    });

    it("should have hover effects", () => {
      render(<Card data-testid="test-card" />);

      const card = screen.getByTestId("test-card");
      expect(card).toHaveClass("hover:shadow-md", "transition-shadow");
    });
  });

  describe("CardHeader", () => {
    it("should render card header", () => {
      render(<CardHeader data-testid="test-header">Header content</CardHeader>);

      const header = screen.getByTestId("test-header");
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent("Header content");
    });

    it("should have proper header styling", () => {
      render(<CardHeader data-testid="test-header" />);

      const header = screen.getByTestId("test-header");
      expect(header).toHaveClass(
        "flex",
        "flex-col",
        "space-y-2",
        "p-6",
        "pb-4"
      );
    });

    it("should accept custom className", () => {
      const customClass = "custom-header-class";
      render(<CardHeader className={customClass} data-testid="test-header" />);

      const header = screen.getByTestId("test-header");
      expect(header).toHaveClass(customClass);
    });
  });

  describe("CardTitle", () => {
    it("should render card title", () => {
      const title = "Test Card Title";
      render(<CardTitle>{title}</CardTitle>);

      expect(screen.getByText(title)).toBeInTheDocument();
    });

    it("should have proper title styling", () => {
      render(<CardTitle data-testid="test-title">Title</CardTitle>);

      const title = screen.getByTestId("test-title");
      expect(title).toHaveClass("font-semibold", "tracking-tight");
    });

    it("should render as h3 by default", () => {
      render(<CardTitle>Title</CardTitle>);

      const title = screen.getByRole("heading", { level: 3 });
      expect(title).toBeInTheDocument();
    });
  });

  describe("CardDescription", () => {
    it("should render card description", () => {
      const description = "This is a card description";
      render(<CardDescription>{description}</CardDescription>);

      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it("should have proper description styling", () => {
      render(
        <CardDescription data-testid="test-description">
          Description
        </CardDescription>
      );

      const description = screen.getByTestId("test-description");
      expect(description).toHaveClass("text-sm", "text-muted-foreground");
    });

    it("should render as paragraph by default", () => {
      render(<CardDescription>Description</CardDescription>);

      const description = screen.getByText("Description");
      expect(description.tagName).toBe("P");
    });
  });

  describe("CardContent", () => {
    it("should render card content", () => {
      render(<CardContent data-testid="test-content">Content</CardContent>);

      const content = screen.getByTestId("test-content");
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent("Content");
    });

    it("should have proper content styling", () => {
      render(<CardContent data-testid="test-content" />);

      const content = screen.getByTestId("test-content");
      expect(content).toHaveClass("p-6", "pt-2");
    });
  });

  describe("CardFooter", () => {
    it("should render card footer", () => {
      render(<CardFooter data-testid="test-footer">Footer</CardFooter>);

      const footer = screen.getByTestId("test-footer");
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveTextContent("Footer");
    });

    it("should have proper footer styling", () => {
      render(<CardFooter data-testid="test-footer" />);

      const footer = screen.getByTestId("test-footer");
      expect(footer).toHaveClass("flex", "items-center", "p-6", "pt-0");
    });
  });

  describe("Card Composition", () => {
    it("should work together as complete card", () => {
      const title = "Complete Card Title";
      const description = "Card description text";
      const content = "Main card content";
      const footerText = "Card footer";

      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{content}</p>
          </CardContent>
          <CardFooter>
            <span>{footerText}</span>
          </CardFooter>
        </Card>
      );

      // All parts should be rendered
      expect(screen.getByText(title)).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();
      expect(screen.getByText(content)).toBeInTheDocument();
      expect(screen.getByText(footerText)).toBeInTheDocument();

      // Structure should be maintained
      const card = screen.getByTestId("complete-card");
      expect(card).toBeInTheDocument();
    });

    it("should support nested content", () => {
      render(
        <Card>
          <CardContent>
            <div data-testid="nested-content">
              <h4>Nested Heading</h4>
              <p>Nested paragraph</p>
              <ul>
                <li>List item 1</li>
                <li>List item 2</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      );

      const nestedContent = screen.getByTestId("nested-content");
      expect(nestedContent).toBeInTheDocument();
      expect(screen.getByText("Nested Heading")).toBeInTheDocument();
      expect(screen.getByText("List item 1")).toBeInTheDocument();
    });

    it("should handle empty sections gracefully", () => {
      render(
        <Card data-testid="partial-card">
          <CardHeader>
            <CardTitle>Only Title</CardTitle>
          </CardHeader>
          <CardContent />
          <CardFooter />
        </Card>
      );

      const card = screen.getByTestId("partial-card");
      expect(card).toBeInTheDocument();
      expect(screen.getByText("Only Title")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should support ARIA attributes", () => {
      render(
        <Card
          role="article"
          aria-label="Test card"
          aria-describedby="card-description"
          data-testid="accessible-card"
        >
          <CardHeader>
            <CardTitle>Accessible Card</CardTitle>
            <CardDescription id="card-description">
              This card has proper ARIA attributes
            </CardDescription>
          </CardHeader>
        </Card>
      );

      const card = screen.getByTestId("accessible-card");
      expect(card).toHaveAttribute("role", "article");
      expect(card).toHaveAttribute("aria-label", "Test card");
      expect(card).toHaveAttribute("aria-describedby", "card-description");
    });

    it("should maintain semantic heading hierarchy", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Main Title</CardTitle>
          </CardHeader>
        </Card>
      );

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent("Main Title");
    });

    it("should be keyboard navigable when interactive", () => {
      const handleCardClick = vi.fn();

      render(
        <Card
          tabIndex={0}
          onClick={handleCardClick}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCardClick();
            }
          }}
          data-testid="interactive-card"
        >
          <CardContent>Interactive card</CardContent>
        </Card>
      );

      const card = screen.getByTestId("interactive-card");

      // Should be focusable
      card.focus();
      expect(card).toHaveFocus();

      // Should respond to keyboard events
      fireEvent.keyDown(card, { key: "Enter" });
      expect(handleCardClick).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(card, { key: " " });
      expect(handleCardClick).toHaveBeenCalledTimes(2);
    });
  });

  describe("Responsive Design", () => {
    it("should have responsive padding classes", () => {
      render(
        <Card>
          <CardHeader data-testid="header" />
          <CardContent data-testid="content" />
          <CardFooter data-testid="footer" />
        </Card>
      );

      // Check for responsive padding classes
      const header = screen.getByTestId("header");
      const content = screen.getByTestId("content");
      const footer = screen.getByTestId("footer");

      expect(header).toHaveClass("p-6");
      expect(content).toHaveClass("p-6");
      expect(footer).toHaveClass("p-6");
    });
  });
});
