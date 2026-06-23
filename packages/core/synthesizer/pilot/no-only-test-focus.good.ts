// GOOD: plain it — all sibling tests run normally.
it('should compute sum', () => {
  expect(1 + 1).toBe(2);
});

it('should also run', () => {
  expect(2 + 2).toBe(4);
});
