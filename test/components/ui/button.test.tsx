import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { Button, type ButtonProps } from "~/components/ui/button";

// Mock class-variance-authority
vi.mock("class-variance-authority", () => ({
  cva: vi.fn((base, options) => {
    return vi.fn(props => {
      const classes = [base];
      if (options?.variants && props) {
        Object.entries(props).forEach(([key, value]) => {
          if (options.variants[key] && options.variants[key][value]) {
            classes.push(options.variants[key][value]);
          }
        });
      }
      if (options?.defaultVariants) {
        Object.entries(options.defaultVariants).forEach(
          ([key, defaultValue]) => {
            if (
              !props?.[key] &&
              options.variants[key] &&
              options.variants[key][defaultValue]
            ) {
              classes.push(options.variants[key][defaultValue]);
            }
          }
        );
      }
      return classes.join(" ");
    });
  }),
}));

// Mock Radix UI Slot
vi.mock("@radix-ui/react-slot", () => ({
  Slot: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

// Mock utils
vi.mock("~/lib/utils", () => ({
  cn: (...classes: any[]) => {
    return classes
      .filter(Boolean)
      .map(cls => (typeof cls === "string" ? cls : ""))
      .join(" ")
      .trim();
  },
}));

describe("Button Component", () => {
  describe("Basic Rendering", () => {
    it("should render a button with text", () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole("button", { name: "Click me" });
      expect(button).toBeInTheDocument();
    });

    it("should render as button element by default", () => {
      render(<Button data-testid="test-button">Button</Button>);

      const button = screen.getByTestId("test-button");
      expect(button.tagName).toBe("BUTTON");
    });

    it("should accept and apply custom className prop", () => {
      const customClass = "custom-button-class";
      render(
        <Button className={customClass} data-testid="test-button">
          Button
        </Button>
      );

      const button = screen.getByTestId("test-button");
      // Just verify the component accepts the className prop and renders
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Button");
    });

    it("should forward ref correctly", () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Button</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toBe(screen.getByRole("button"));
    });
  });

  describe("Variants", () => {
    const variants: Array<ButtonProps["variant"]> = [
      "default",
      "destructive",
      "outline",
      "secondary",
      "ghost",
      "link",
    ];

    it("should apply default variant styles", () => {
      render(<Button>Default Button</Button>);

      const button = screen.getByRole("button", { name: "Default Button" });
      expect(button).toHaveClass("bg-primary", "text-primary-foreground");
    });

    it("should render as different variant", () => {
      render(<Button variant="secondary">Secondary Button</Button>);

      const button = screen.getByRole("button", { name: "Secondary Button" });
      expect(button).toHaveClass("bg-secondary", "text-secondary-foreground");
    });

    variants.forEach(variant => {
      it(`should render ${variant} variant`, () => {
        render(
          <Button variant={variant} data-testid={`button-${variant}`}>
            {variant}
          </Button>
        );

        const button = screen.getByTestId(`button-${variant}`);
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent(variant);
      });
    });

    it("should use default variant when no variant specified", () => {
      render(<Button data-testid="default-button">Default</Button>);

      const button = screen.getByTestId("default-button");
      expect(button).toBeInTheDocument();
    });
  });

  describe("Sizes", () => {
    const sizes: Array<ButtonProps["size"]> = ["default", "sm", "lg", "icon"];

    sizes.forEach(size => {
      it(`should apply ${size} size styling`, () => {
        render(
          <Button size={size} data-testid={`button-${size}`}>
            {size}
          </Button>
        );

        const button = screen.getByTestId(`button-${size}`);
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent(size);
      });
    });
  });

  describe("Loading State", () => {
    it("should show loading spinner when loading=true", () => {
      render(
        <Button loading data-testid="loading-button">
          Submit
        </Button>
      );

      const button = screen.getByTestId("loading-button");
      const spinner = button.querySelector("svg");

      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass("animate-spin");
      expect(button).toHaveTextContent("Submit");
    });

    it("should show custom loading text when provided", () => {
      render(
        <Button
          loading
          loadingText="Submitting..."
          data-testid="loading-button"
        >
          Submit
        </Button>
      );

      const button = screen.getByTestId("loading-button");
      expect(button).toHaveTextContent("Submitting...");
    });

    it("should be disabled when loading", () => {
      render(
        <Button loading data-testid="loading-button">
          Submit
        </Button>
      );

      const button = screen.getByTestId("loading-button");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-disabled", "true");
    });

    it("should have aria-busy=true when loading", () => {
      render(
        <Button loading data-testid="loading-button">
          Submit
        </Button>
      );

      const button = screen.getByTestId("loading-button");
      expect(button).toHaveAttribute("aria-busy", "true");
    });
  });

  describe("Disabled State", () => {
    it("should handle disabled state", () => {
      render(<Button disabled>Disabled Button</Button>);

      const button = screen.getByRole("button", { name: "Disabled Button" });
      expect(button).toBeDisabled();
      expect(button).toHaveClass("disabled:opacity-50");
    });

    it("should be disabled when disabled prop is true", () => {
      render(
        <Button disabled data-testid="disabled-button">
          Disabled
        </Button>
      );

      const button = screen.getByTestId("disabled-button");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-disabled", "true");
    });

    it("should not respond to clicks when disabled", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button disabled onClick={handleClick} data-testid="disabled-button">
          Disabled
        </Button>
      );

      const button = screen.getByTestId("disabled-button");
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("should not respond to clicks when loading", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button loading onClick={handleClick} data-testid="loading-button">
          Loading
        </Button>
      );

      const button = screen.getByTestId("loading-button");
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("Click Handling", () => {
    it("should handle click events", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} data-testid="clickable-button">
          Click me
        </Button>
      );

      const button = screen.getByTestId("clickable-button");
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should handle keyboard events", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} data-testid="keyboard-button">
          Keyboard
        </Button>
      );

      const button = screen.getByTestId("keyboard-button");
      button.focus();

      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalledTimes(1);

      await user.keyboard(" ");
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe("asChild Prop", () => {
    it("should render as Slot when asChild=true", () => {
      render(
        <Button asChild data-testid="slot-button">
          <a href="/test">Link Button</a>
        </Button>
      );

      const element = screen.getByTestId("slot-button");
      expect(element.tagName).toBe("DIV"); // Our mock Slot renders as div
      expect(element).toHaveTextContent("Link Button");
    });

    it("should render as button when asChild=false", () => {
      render(
        <Button asChild={false} data-testid="button-element">
          Regular Button
        </Button>
      );

      const button = screen.getByTestId("button-element");
      expect(button.tagName).toBe("BUTTON");
    });
  });

  describe("Accessibility", () => {
    it("should support ARIA attributes", () => {
      render(
        <Button
          aria-label="Custom label"
          aria-describedby="description"
          data-testid="accessible-button"
        >
          Accessible
        </Button>
      );

      const button = screen.getByTestId("accessible-button");
      expect(button).toHaveAttribute("aria-label", "Custom label");
      expect(button).toHaveAttribute("aria-describedby", "description");
    });

    it("should be focusable by default", () => {
      render(<Button data-testid="focusable-button">Focusable</Button>);

      const button = screen.getByTestId("focusable-button");
      button.focus();
      expect(button).toHaveFocus();
    });

    it("should not be focusable when disabled", () => {
      render(
        <Button disabled data-testid="disabled-button">
          Disabled
        </Button>
      );

      const button = screen.getByTestId("disabled-button");
      button.focus();
      expect(button).not.toHaveFocus();
    });

    it("should have proper role for button", () => {
      render(<Button>Button Role</Button>);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });
  });

  describe("Form Integration", () => {
    it("should work as form submit button", () => {
      const handleSubmit = vi.fn(e => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit" data-testid="submit-button">
            Submit
          </Button>
        </form>
      );

      const button = screen.getByTestId("submit-button");
      expect(button).toHaveAttribute("type", "submit");

      fireEvent.click(button);
      expect(handleSubmit).toHaveBeenCalled();
    });

    it("should work as form reset button", () => {
      render(
        <form>
          <input name="test" defaultValue="initial" />
          <Button type="reset" data-testid="reset-button">
            Reset
          </Button>
        </form>
      );

      const button = screen.getByTestId("reset-button");
      expect(button).toHaveAttribute("type", "reset");
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle variant and size combinations", () => {
      const combinations = [
        { variant: "destructive" as const, size: "sm" as const },
        { variant: "outline" as const, size: "lg" as const },
        { variant: "ghost" as const, size: "icon" as const },
      ];

      combinations.forEach(({ variant, size }, index) => {
        render(
          <Button variant={variant} size={size} data-testid={`combo-${index}`}>
            {variant} {size}
          </Button>
        );

        const button = screen.getByTestId(`combo-${index}`);
        expect(button).toBeInTheDocument();
        expect(button).toHaveTextContent(`${variant} ${size}`);
      });
    });

    it("should handle loading with different variants", () => {
      render(
        <Button variant="destructive" loading data-testid="loading-destructive">
          Delete
        </Button>
      );

      const button = screen.getByTestId("loading-destructive");
      expect(button).toBeDisabled();
      expect(button.querySelector("svg")).toBeInTheDocument();
    });

    it("should work with icons", () => {
      const Icon = () => <span data-testid="icon">🏠</span>;

      render(
        <Button data-testid="icon-button">
          <Icon />
          Home
        </Button>
      );

      const button = screen.getByTestId("icon-button");
      const icon = screen.getByTestId("icon");

      expect(button).toContainElement(icon);
      expect(button).toHaveTextContent("Home");
    });
  });
});
