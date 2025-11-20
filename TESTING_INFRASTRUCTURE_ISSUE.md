# GitHub Issue: Implement Testing Infrastructure (Unit, Integration, E2E)

## Problem

The project currently has **zero automated tests**. There are no unit tests, integration tests, or end-to-end tests. This creates significant risks:

- No safety net when refactoring code
- No way to verify bug fixes don't introduce regressions
- Manual testing only (time-consuming and error-prone)
- Cannot confidently deploy changes to production
- No test-driven development workflow possible

## Current State

- ❌ No test files (.test.ts, .spec.ts)
- ❌ No test framework configuration (Jest, Vitest, Playwright, Cypress)
- ❌ No test utilities or fixtures
- ❌ No test coverage reporting
- ❌ No CI/CD test automation
- ⚠️ Only one script: `test-migrations.ts` for manual database migration testing

## Proposed Solution

Implement a comprehensive testing infrastructure with three layers:

### 1. Unit Testing (Vitest)
- Test database services (`server/services/*.ts`)
- Test composables (`app/composables/*.ts`)
- Test utilities (`app/utils/*.ts`, `server/utils/*.ts`)
- Test components (`app/components/*.vue`)

**Tools:** Vitest (fast, Vite-native, TypeScript support)

### 2. Integration Testing (Vitest + h3)
- Test API endpoints (`server/api/**/*.ts`)
- Test authentication middleware
- Test database interactions
- Test file upload functionality

**Tools:** Vitest + @nuxt/test-utils

### 3. End-to-End Testing (Playwright)
- Test critical user flows:
  - Admin campaign creation
  - User invitation and acceptance
  - Content creation and editing
  - Public campaign signup
  - Prayer fuel viewing
- Test across multiple browsers
- Test mobile responsiveness

**Tools:** Playwright

## Implementation Tasks

### Phase 1: Setup & Configuration
- [ ] Install Vitest and testing dependencies
- [ ] Configure Vitest for Nuxt 4
- [ ] Install Playwright
- [ ] Create test setup files and utilities
- [ ] Configure TypeScript for test files
- [ ] Add test scripts to package.json
- [ ] Create test database configuration

### Phase 2: Unit Tests (Priority Services)
- [ ] Test `server/services/campaigns.ts` (campaign CRUD, slug generation)
- [ ] Test `server/services/libraries.ts` (library management)
- [ ] Test `server/services/library-content.ts` (content management)
- [ ] Test `server/services/users.ts` (user operations)
- [ ] Test `server/services/roles.ts` (role/permission logic)
- [ ] Test `server/utils/auth.ts` (authentication helpers)
- [ ] Test composables (useModal, useCampaign, etc.)

### Phase 3: Integration Tests (Critical Endpoints)
- [ ] Test `/api/auth/*` endpoints (login, invitation, acceptance)
- [ ] Test `/api/admin/campaigns/*` endpoints
- [ ] Test `/api/admin/libraries/*` endpoints
- [ ] Test `/api/admin/users/*` endpoints
- [ ] Test `/api/campaigns/[slug]/*` public endpoints
- [ ] Test file upload endpoint (`/api/upload/image`)
- [ ] Test authentication middleware protection

### Phase 4: E2E Tests (Critical Flows)
- [ ] Admin login and dashboard access
- [ ] Create campaign with library
- [ ] Create and edit library content
- [ ] Invite user and accept invitation
- [ ] Public campaign signup flow
- [ ] View prayer fuel (current and past)
- [ ] Language switching

### Phase 5: CI/CD Integration
- [ ] Add GitHub Actions workflow for tests
- [ ] Configure test database for CI
- [ ] Add test coverage reporting
- [ ] Add coverage thresholds (e.g., 80% minimum)
- [ ] Block PRs with failing tests
- [ ] Add test status badge to README

## Acceptance Criteria

- [ ] All three test types configured and running
- [ ] Minimum 70% code coverage on critical services
- [ ] All critical API endpoints have integration tests
- [ ] All critical user flows have E2E tests
- [ ] Tests run automatically in CI/CD
- [ ] Test documentation added to project
- [ ] npm test command runs all tests successfully

## Technical Considerations

- Use test database (separate from development DB)
- Mock external services (S3, email, WhatsApp)
- Use fixtures for test data
- Implement database cleanup/reset between tests
- Consider parallel test execution for speed
- Use TypeScript for all test files

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Nuxt Test Utils](https://nuxt.com/docs/getting-started/testing)
- [Playwright Documentation](https://playwright.dev/)

## Priority

**High** - This is critical for production readiness and safe continuous deployment.

---

**Labels:** enhancement, testing, infrastructure, high-priority
**Estimated Effort:** 2-3 weeks (depending on coverage goals)
**Dependencies:** None (can start immediately)
