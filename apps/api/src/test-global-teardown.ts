// Global teardown for Jest tests
// This runs after all test suites have completed

export default async function globalTeardown() {
  // Force cleanup of any remaining resources
  // This ensures Jest exits cleanly even if some resources weren't properly closed
}
