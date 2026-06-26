// BAD: it.only silently disables all sibling tests in the suite — only this test runs.
it.only('should compute sum', () => {
  expect(1 + 1).toBe(2);
});

it('should also run', () => {
  expect(2 + 2).toBe(4);
});
