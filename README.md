# Basketball Subs

This is a Progressive Web Application that is designed to help a basketball coach track how long each player has played in a game.

The GitHub hosted page can be accessed at: https://acbgbca.github.io/basketball-subs/

## Testing Instructions

### Playwright End-to-End Tests

First-time setup:
```bash
npx playwright install --include-deps  # Install browser dependencies
```

Running tests:
```bash
npx playwright test  # Run all tests in all browsers
npx playwright test e2e/team.spec.ts  # Run a specific test file
npx playwright test --project=chromium  # Run all tests in Chrome only
npx playwright test e2e/team.spec.ts --project=chromium  # Run specific test in Chrome only
```

To debug failed tests, you can view the HTML report:
```bash
npx playwright show-report
```

### Jest Unit Tests

Running tests:
```bash
npm test  # Run all tests in watch mode
npm test TeamOperations  # Run tests matching 'TeamOperations'
npm test -- --watchAll=false  # Run all tests once
npm test -- --coverage  # Run tests with coverage report
```

