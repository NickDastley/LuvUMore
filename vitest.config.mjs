/** @type {import('vitest').UserConfig} */
export default {
  test: {
    environment: 'node',
    include: ['server/test/**/*.test.js'],
  },
};
