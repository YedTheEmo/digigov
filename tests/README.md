# Testing Guide

This document describes the testing structure, utilities, and best practices for the DigiGov project.

## Test Structure

Tests are organized to mirror the source code structure:

```
tests/
├── unit/              # Unit tests
│   ├── lib/           # Library function tests
│   ├── components/    # Component tests
│   ├── hooks/         # React hook tests
│   └── __helpers__/   # Test utilities and factories
├── integration/       # Integration tests
├── e2e/              # End-to-end tests
└── ui/               # Playwright UI tests
```

## Running Tests

```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode
npm run test:unit:watch

# Run tests with coverage
npm run test:unit:coverage

# Run tests with UI
npm run test:unit:ui

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run UI tests (Playwright)
npm run test:ui
```

## Test Framework

We use [Vitest](https://vitest.dev/) as our test framework, which provides:
- Fast execution with ESM support
- Built-in TypeScript support
- Jest-compatible API
- Excellent Next.js integration

## Test Utilities

### Test Helpers

Located in `tests/unit/__helpers__/`:

- **test-utils.tsx**: Custom render function for React components with providers
- **mock-prisma.ts**: Prisma client mocking utilities
- **mock-next-auth.ts**: NextAuth session mocking utilities
- **mock-next-request.ts**: Next.js Request mocking for API route testing

### Test Data Factories

Located in `tests/unit/__helpers__/factories/`:

Factories provide a convenient way to create test data:

```typescript
import { createProcurementCase, createUser } from '../__helpers__/factories';

const case_ = createProcurementCase({
  method: 'SMALL_VALUE_RFQ',
  currentState: 'DRAFT',
});

const user = createUser({ role: 'ADMIN' });
```

Available factories:
- `createProcurementCase`
- `createUser`
- `createRFQ`
- `createQuotation`
- `createORS`
- `createDV`
- `createCheck`
- `createActivityLog`

## Writing Tests

### Unit Tests

Unit tests should:
- Test a single function or component in isolation
- Use mocks for external dependencies
- Be fast and deterministic
- Follow the Arrange-Act-Assert pattern

Example:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { myFunction } from '@/lib/myModule';

describe('myFunction', () => {
  it('should return expected value when given valid input', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Component Tests

Use React Testing Library for component tests:

```typescript
import { render, screen } from '../__helpers__/test-utils';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Hook Tests

Use `renderHook` from React Testing Library:

```typescript
import { renderHook } from '@testing-library/react';
import { useMyHook } from '@/hooks/useMyHook';

describe('useMyHook', () => {
  it('returns expected value', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe('expected');
  });
});
```

## Mocking

### Mocking Prisma

```typescript
import { vi } from 'vitest';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    procurementCase: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// In your test
vi.mocked(prisma.procurementCase.findUnique).mockResolvedValue(mockCase);
```

### Mocking NextAuth

```typescript
import { vi } from 'vitest';
import { auth } from '@/lib/nextauth';

vi.mock('@/lib/nextauth', () => ({
  auth: vi.fn(),
}));

// In your test
vi.mocked(auth).mockResolvedValue({
  user: { email: 'test@example.com' },
});
```

### Mocking Next.js Router

The router is automatically mocked in `tests/setup.ts`. You can override if needed:

```typescript
import { useRouter } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));
```

## Best Practices

### Test Naming

Use descriptive test names that explain what is being tested:

```typescript
// Good
it('should block edit when downstream data exists and user is not admin', () => {
  // ...
});

// Bad
it('test edit', () => {
  // ...
});
```

### Test Organization

Group related tests using `describe` blocks:

```typescript
describe('MyModule', () => {
  describe('functionA', () => {
    it('should handle case 1', () => {});
    it('should handle case 2', () => {});
  });
  
  describe('functionB', () => {
    it('should handle case 1', () => {});
  });
});
```

### Test Isolation

Each test should be independent:
- Use `beforeEach` to set up fresh state
- Clear mocks between tests
- Don't rely on test execution order

### Coverage Goals

- **src/lib/**: 70%+ coverage
- **src/components/**: 60%+ coverage
- **src/hooks/**: 50%+ coverage

Focus on testing:
- Business logic
- Edge cases
- Error handling
- Critical user flows

## Coverage Reports

Coverage reports are generated when running `npm run test:unit:coverage`:
- HTML report: `coverage/index.html`
- LCOV report: `coverage/lcov.info`
- JSON report: `coverage/coverage-final.json`

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch

Coverage thresholds are enforced:
- Lines: 60%
- Functions: 60%
- Branches: 50%
- Statements: 60%

## Troubleshooting

### Tests failing with module resolution errors

Ensure `vitest.config.ts` has the correct path aliases matching `tsconfig.json`.

### Tests timing out

- Check for unhandled promises
- Ensure mocks are properly set up
- Verify async operations complete

### Coverage not showing

- Ensure `@vitest/coverage-v8` is installed
- Check that files are not in the exclude list in `vitest.config.ts`

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

