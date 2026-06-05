/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^isomorphic-dompurify$': 'dompurify',
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/out/**',
    '!**/scripts/**',
    '!**/content/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
        },
      },
    ],
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/out/'],
  transformIgnorePatterns: [
    '/node_modules/(?!(unified|bail|is-plain-obj|trough|remark-parse|remark-rehype|rehype-raw|rehype-stringify|remark-math|rehype-katex|mdast-util-.*|micromark.*|decode-named-character-reference|character-entities|property-information|hast-util-.*|space-separated-tokens|comma-separated-tokens|unist-util-.*|ccount|escape-string-regexp|markdown-table|zwitch|longest-streak|trim-lines|web-namespaces|hastscript|html-void-elements|html-url-attributes|stringify-entities|character-reference-invalid|is-decimal|is-hexadecimal|is-alphanumerical|is-alphabetical|character-entities-legacy|character-entities-html4|devlop|estree-util-is-identifier-name)/)',
  ],
};
