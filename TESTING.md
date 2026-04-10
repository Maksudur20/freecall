# 🧪 FreeCall - Testing Guide

## Overview

This guide covers unit testing, integration testing, and end-to-end testing for the FreeCall application.

---

## 1. Setup Testing Environment

### Install Testing Dependencies

```bash
# Backend testing
cd backend
npm install --save-dev jest supertest @testing-library/react

# Frontend testing
cd ../frontend
npm install --save-dev vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

### Configure Test Runners

#### Backend Jest Config

Create `backend/jest.config.js`:

```javascript
module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.js", "!src/server.js"],
  testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
```

#### Frontend Vitest Config

Update `frontend/vite.config.js`:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
```

Create `frontend/src/__tests__/setup.js`:

```javascript
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

---

## 2. Backend Testing

### Unit Tests

#### API Service Tests

Create `backend/src/__tests__/services/auth.test.js`:

```javascript
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import * as authService from "../../services/authService.js";
import User from "../../models/User.js";

describe("Auth Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    it("should create a new user with hashed password", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "SecurePass123!",
      };

      const result = await authService.registerUser(userData);

      expect(result).toHaveProperty("_id");
      expect(result.email).toBe(userData.email);
      expect(result.password).not.toBe(userData.password);
    });

    it("should throw error if user already exists", async () => {
      await authService.registerUser({
        username: "testuser",
        email: "test@example.com",
        password: "SecurePass123!",
      });

      await expect(
        authService.registerUser({
          username: "testuser",
          email: "test@example.com",
          password: "DifferentPass123!",
        })
      ).rejects.toThrow("User already exists");
    });
  });

  describe("generateTokens", () => {
    it("should generate access and refresh tokens", () => {
      const userId = "507f1f77bcf86cd799439011";
      const tokens = authService.generateTokens(userId);

      expect(tokens).toHaveProperty("accessToken");
      expect(tokens).toHaveProperty("refreshToken");
      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
    });
  });
});
```

#### Controller Tests

Create `backend/src/__tests__/controllers/auth.test.js`:

```javascript
import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import app from "../../server.js";

describe("Auth Controller", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const response = await request(app).post("/api/auth/register").send({
        username: "newuser",
        email: "newuser@example.com",
        password: "SecurePass123!",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("accessToken");
    });

    it("should return 400 for invalid email", async () => {
      const response = await request(app).post("/api/auth/register").send({
        username: "newuser",
        email: "invalid-email",
        password: "SecurePass123!",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send({
        username: "testuser",
        email: "test@example.com",
        password: "SecurePass123!",
      });
    });

    it("should login with correct credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "SecurePass123!",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("accessToken");
    });

    it("should return 401 for invalid password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "WrongPassword123!",
      });

      expect(response.status).toBe(401);
    });
  });
});
```

### Integration Tests

Create `backend/src/__tests__/integration/chat.test.js`:

```javascript
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import request from "supertest";
import app from "../../server.js";
import User from "../../models/User.js";
import Conversation from "../../models/Conversation.js";

describe("Chat Integration Tests", () => {
  let user1, user2, authToken;

  beforeEach(async () => {
    // Create test users
    user1 = await User.create({
      username: "user1",
      email: "user1@example.com",
      password: "hashedpassword1",
    });

    user2 = await User.create({
      username: "user2",
      email: "user2@example.com",
      password: "hashedpassword2",
    });

    // Login and get token
    const response = await request(app).post("/api/auth/login").send({
      email: "user1@example.com",
      password: "password1",
    });

    authToken = response.body.accessToken;
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Conversation.deleteMany({});
  });

  it("should create a conversation between two users", async () => {
    const response = await request(app)
      .post("/api/chat/conversations")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        participantId: user2._id,
      });

    expect(response.status).toBe(201);
    expect(response.body.conversation).toHaveProperty("_id");
    expect(response.body.conversation.participants).toContain(user1._id);
    expect(response.body.conversation.participants).toContain(user2._id);
  });

  it("should send a message in conversation", async () => {
    // Create conversation first
    const convResponse = await request(app)
      .post("/api/chat/conversations")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        participantId: user2._id,
      });

    const conversationId = convResponse.body.conversation._id;

    // Send message
    const response = await request(app)
      .post("/api/chat/message/send")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        conversationId,
        content: "Hello, this is a test message",
      });

    expect(response.status).toBe(201);
    expect(response.body.message.content).toBe(
      "Hello, this is a test message"
    );
  });
});
```

### Run Backend Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test auth.test.js

# Watch mode
npm test -- --watch
```

---

## 3. Frontend Testing

### Component Tests

Create `frontend/src/__tests__/components/MessageBubble.test.jsx`:

```javascript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import MessageBubble from "../../components/chat/MessageBubble";

describe("MessageBubble Component", () => {
  const mockMessage = {
    _id: "1",
    content: "Test message",
    senderId: {
      _id: "user1",
      username: "TestUser",
      profilePicture: "https://example.com/pic.jpg",
    },
    status: "delivered",
    createdAt: new Date(),
  };

  it("renders message content", () => {
    render(<MessageBubble message={mockMessage} isOwn={false} />);
    expect(screen.getByText("Test message")).toBeTruthy();
  });

  it("shows sender name for other messages", () => {
    render(<MessageBubble message={mockMessage} isOwn={false} />);
    expect(screen.getByText("TestUser")).toBeTruthy();
  });

  it("applies different styling for own messages", () => {
    const { container } = render(
      <MessageBubble message={mockMessage} isOwn={true} />
    );
    const bubble = container.querySelector("[class*='bg-blue']");
    expect(bubble).toBeTruthy();
  });
});
```

Create `frontend/src/__tests__/components/MessageInput.test.jsx`:

```javascript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import MessageInput from "../../components/chat/MessageInput";

describe("MessageInput Component", () => {
  it("renders input field", () => {
    const mockOnSend = vi.fn();
    render(
      <MessageInput
        onSend={mockOnSend}
        isLoading={false}
        onTyping={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/type a message/i)).toBeTruthy();
  });

  it("sends message on Enter key", () => {
    const mockOnSend = vi.fn();
    const { container } = render(
      <MessageInput
        onSend={mockOnSend}
        isLoading={false}
        onTyping={vi.fn()}
      />
    );

    const input = container.querySelector("textarea");
    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockOnSend).toHaveBeenCalledWith("Test message");
  });

  it("does not send on Shift+Enter", () => {
    const mockOnSend = vi.fn();
    const { container } = render(
      <MessageInput
        onSend={mockOnSend}
        isLoading={false}
        onTyping={vi.fn()}
      />
    );

    const input = container.querySelector("textarea");
    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });

    expect(mockOnSend).not.toHaveBeenCalled();
  });
});
```

### Store Tests

Create `frontend/src/__tests__/stores/auth.test.js`:

```javascript
import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../../stores/auth";

describe("Auth Store", () => {
  beforeEach(() => {
    const store = useAuthStore();
    store.reset();
  });

  it("should initialize with no user", () => {
    const store = useAuthStore();
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it("should set user on login", () => {
    const store = useAuthStore();
    const mockUser = {
      _id: "1",
      username: "testuser",
      email: "test@example.com",
    };

    store.setUser(mockUser);

    expect(store.user).toEqual(mockUser);
    expect(store.isAuthenticated).toBe(true);
  });

  it("should clear user on logout", () => {
    const store = useAuthStore();

    store.setUser({ _id: "1", username: "testuser" });
    store.logout();

    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });
});
```

### Run Frontend Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test MessageBubble.test.jsx

# Watch mode
npm test -- --watch

# UI mode
npm test -- --ui
```

---

## 4. End-to-End Testing

### Setup Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

Create `frontend/playwright.config.js`:

```javascript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

Create `frontend/e2e/auth.spec.js`:

```javascript
import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should register a new user", async ({ page }) => {
    await page.goto("/register");

    await page.fill('input[name="username"]', "newuser");
    await page.fill('input[name="email"]', "newuser@example.com");
    await page.fill('input[name="password"]', "SecurePass123!");
    await page.fill('input[name="confirmPassword"]', "SecurePass123!");

    await page.click('button[type="submit"]');

    await page.waitForURL("/chat");
    expect(page.url()).toContain("/chat");
  });

  test("should login with valid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "TestPass123!");

    await page.click('button[type="submit"]');

    await page.waitForURL("/chat");
    expect(page.url()).toContain("/chat");
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "WrongPassword");

    await page.click('button[type="submit"]');

    const errorMessage = await page.textContent(".error-message");
    expect(errorMessage).toContain("Invalid credentials");
  });
});
```

Create `frontend/e2e/chat.spec.js`:

```javascript
import { test, expect } from "@playwright/test";

test.describe("Chat Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login");
    await page.fill('input[name="email"]', "user1@example.com");
    await page.fill('input[name="password"]', "TestPass123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/chat");
  });

  test("should send a message", async ({ page }) => {
    // Select conversation
    await page.click('text="User2"');

    // Send message
    const messageInput = await page.locator('textarea[placeholder*="message"]');
    await messageInput.fill("Hello, this is a test message");
    await messageInput.press("Enter");

    // Verify message appears
    await expect(
      page.locator("text=Hello, this is a test message")
    ).toBeVisible();
  });

  test("should see typing indicator", async ({ page, context }) => {
    // Open second user's browser
    const page2 = await context.newPage();

    // First user opens chat
    await page.click('text="User2"');

    // Second user logs in
    await page2.goto("/login");
    await page2.fill('input[name="email"]', "user2@example.com");
    await page2.fill('input[name="password"]', "TestPass123!");
    await page2.click('button[type="submit"]');
    await page2.waitForURL("/chat");
    await page2.click('text="User1"');

    // First user starts typing
    const input = page.locator('textarea[placeholder*="message"]');
    await input.focus();
    await input.type("Hel", { delay: 100 });

    // Second user should see typing indicator
    await expect(page2.locator('text="User1 is typing"')).toBeVisible();
  });
});
```

### Run E2E Tests

```bash
# Run all e2e tests
npx playwright test

# Debug mode
npx playwright test --debug

# UI mode
npx playwright test --ui

# Run specific test file
npx playwright test e2e/auth.spec.js

# Run in headed mode (show browser)
npx playwright test --headed
```

---

## 5. Performance Testing

### Load Testing with k6

Install k6 from https://k6.io/

Create `backend/load-test.js`:

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 20 }, // ramp-up
    { duration: "1m30s", target: 20 }, // stay at 20
    { duration: "30s", target: 0 }, // ramp-down
  ],
};

export default function () {
  // Register
  const payload = JSON.stringify({
    username: `user_${Date.now()}`,
    email: `user_${Date.now()}@example.com`,
    password: "SecurePass123!",
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = http.post(
    "http://localhost:5000/api/auth/register",
    payload,
    params
  );

  check(response, {
    "registration successful": (r) => r.status === 201,
  });

  sleep(1);
}
```

Run load test:

```bash
k6 run backend/load-test.js
```

---

## 6. Test Coverage Report

### Generate Coverage

```bash
# Backend
cd backend
npm test -- --coverage

# Frontend
cd ../frontend
npm test -- --coverage
```

### Analyze Gaps

Coverage reports show which code isn't tested. Aim for:

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

---

## 7. CI/CD Test Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm run install:all

      - name: Lint
        run: npm run lint

      - name: Backend tests
        run: npm run test:backend

      - name: Frontend tests
        run: npm run test:frontend

      - name: E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## Test Scripts to Add to package.json

```json
{
  "scripts": {
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "jest --detectOpenHandles",
    "test:backend:watch": "jest --watch",
    "test:backend:coverage": "jest --coverage",
    "test:frontend": "vitest",
    "test:frontend:watch": "vitest --watch",
    "test:frontend:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:ui": "playwright test --ui",
    "test:load": "k6 run backend/load-test.js"
  }
}
```

---

## Testing Best Practices

- ✅ Write tests as you code
- ✅ Aim for high coverage (80%+)
- ✅ Use meaningful test descriptions
- ✅ Test both happy path and edge cases
- ✅ Mock external dependencies
- ✅ Keep tests isolated and independent
- ✅ Use fixtures for test data
- ✅ Test user workflows (E2E)
- ✅ Perform load testing before production
- ✅ Automate tests in CI/CD

---

**Happy Testing! 🧪**
