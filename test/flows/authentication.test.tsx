import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  setupComponentTest,
  createMockUser,
  createMockSession,
} from "../helpers/test-utils";
import React from "react";

// Set up component test environment
setupComponentTest();

// Mock the auth context
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();

const MockAuthProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="auth-provider">{children}</div>
);

vi.mock("~/contexts/auth-context", () => ({
  useAuth: () => ({
    user: null,
    session: null,
    signIn: mockSignIn,
    signOut: mockSignOut,
    isLoading: false,
  }),
  AuthProvider: MockAuthProvider,
}));

// Create a simple login form component for testing
const LoginForm = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await mockSignIn(email, password);
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing In..." : "Sign In"}
      </button>
    </form>
  );
};

describe("Authentication Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Login Process", () => {
    it("should render login form", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it("should handle form input changes", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      expect(emailInput).toHaveValue("test@example.com");
      expect(passwordInput).toHaveValue("password123");
    });

    it("should call signIn when form is submitted", async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ success: true });

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(mockSignIn).toHaveBeenCalledWith(
        "test@example.com",
        "password123"
      );
    });

    it("should show loading state during submission", async () => {
      const user = userEvent.setup();

      // Mock a delayed response
      mockSignIn.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ success: true }), 100)
          )
      );

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText("Signing In...")).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText("Sign In")).toBeInTheDocument();
      });
    });

    it("should handle validation for required fields", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      // Browser validation should prevent submission
      // We can't easily test HTML5 validation, but we can check that
      // mockSignIn wasn't called
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it("should handle login errors gracefully", async () => {
      const user = userEvent.setup();
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockSignIn.mockRejectedValue(new Error("Invalid credentials"));

      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), "wrong@example.com");
      await user.type(screen.getByLabelText(/password/i), "wrongpassword");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "Login failed:",
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Authentication Context Integration", () => {
    it("should render auth provider wrapper", () => {
      render(
        <MockAuthProvider>
          <LoginForm />
        </MockAuthProvider>
      );

      // The auth provider mock should be present
      expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
    });
  });

  describe("Form Accessibility", () => {
    it("should have proper form labels", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText(/email/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/password/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("button", { name: /sign in/i })).toHaveFocus();
    });

    it("should support form submission with Enter key", async () => {
      const user = userEvent.setup();
      mockSignIn.mockResolvedValue({ success: true });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");

      // Press Enter while focused on email input
      await user.type(emailInput, "{enter}");

      expect(mockSignIn).toHaveBeenCalledWith(
        "test@example.com",
        "password123"
      );
    });
  });
});
