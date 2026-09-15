export interface StaticSignals {
  hasReadme: boolean;
  readmeSize: number;
  hasLicense: boolean;
  hasGitignore: boolean;
  hasCi: boolean;
  ciProvider?: string;
  hasTests: boolean;
  testFramework?: string;
  hasLinter: boolean;
  linterConfig?: string;
  packageCount?: number;
  hasLockfile: boolean;
  totalFiles: number;
  sourceFilesCount: number;
  topLanguages: Record<string, number>;
  commitCountAnalyzed: number;
}

export interface StaticAnalysisResult {
  signals: StaticSignals;
  deterministicScores: {
    docs: number;
    testing: number;
    gitHygiene: number;
    structure: number;
    dependencyHealth: number;
  };
  staticSuggestions: {
    category: string;
    severity: 'low' | 'med' | 'high';
    filePath: string;
    description: string;
    suggestedFix: string;
  }[];
}

/**
 * Runs deterministic checks on repository file tree and commit data.
 */
export function analyzeStaticSignals(
  filePaths: string[],
  commitMessages: string[] = []
): StaticAnalysisResult {
  const normalizedPaths = filePaths.map((p) => p.toLowerCase());

  // 1. Documentation
  const readmePath = filePaths.find((p) => /readme(\.(md|markdown|txt))?$/i.test(p));
  const hasReadme = !!readmePath;
  const hasLicense = normalizedPaths.some((p) => /licen[sc]e(\.(md|txt))?$/i.test(p));
  const hasContributing = normalizedPaths.some((p) => /contributing(\.md)?$/i.test(p));

  // 2. Git hygiene & config
  const hasGitignore = normalizedPaths.some((p) => p.endsWith('.gitignore'));
  const hasCi = normalizedPaths.some((p) =>
    p.includes('.github/workflows') || p.includes('.gitlab-ci') || p.includes('.circleci')
  );
  const ciProvider = normalizedPaths.some((p) => p.includes('.github/workflows'))
    ? 'GitHub Actions'
    : hasCi
    ? 'CI Config'
    : undefined;

  // 3. Testing
  const testFiles = normalizedPaths.filter(
    (p) =>
      p.includes('__test__') ||
      p.includes('/tests/') ||
      p.includes('/test/') ||
      p.endsWith('.test.ts') ||
      p.endsWith('.test.js') ||
      p.endsWith('.test.tsx') ||
      p.endsWith('.spec.ts') ||
      p.endsWith('.spec.js') ||
      p.endsWith('_test.go') ||
      p.endsWith('_test.py') ||
      p.endsWith('test_.py')
  );
  const hasTests = testFiles.length > 0;
  const testFramework = normalizedPaths.some((p) => p.includes('jest.config') || p.includes('vitest.config'))
    ? 'Vitest/Jest'
    : normalizedPaths.some((p) => p.includes('pytest.ini'))
    ? 'Pytest'
    : hasTests
    ? 'Custom Test Suite'
    : undefined;

  // 4. Linter / Formatter
  const hasLinter = normalizedPaths.some(
    (p) =>
      p.includes('eslint') ||
      p.includes('.prettierrc') ||
      p.includes('biome.json') ||
      p.includes('ruff.toml') ||
      p.includes('.flake8')
  );
  const linterConfig = normalizedPaths.find(
    (p) => p.includes('eslint') || p.includes('biome.json') || p.includes('.prettierrc')
  );

  // 5. Dependencies
  const hasLockfile = normalizedPaths.some(
    (p) =>
      p.endsWith('package-lock.json') ||
      p.endsWith('yarn.lock') ||
      p.endsWith('pnpm-lock.yaml') ||
      p.endsWith('poetry.lock') ||
      p.endsWith('cargo.lock')
  );

  // Compute scores (0 - 100)
  let docsScore = 40;
  if (hasReadme) docsScore += 35;
  if (hasLicense) docsScore += 15;
  if (hasContributing) docsScore += 10;
  docsScore = Math.min(100, docsScore);

  let testingScore = hasTests ? Math.min(95, 50 + testFiles.length * 5) : 25;
  let gitHygieneScore = 50;
  if (hasGitignore) gitHygieneScore += 25;
  if (hasCi) gitHygieneScore += 25;

  let structureScore = 70;
  if (hasLinter) structureScore += 15;
  if (filePaths.length > 5 && filePaths.some((p) => p.includes('src/') || p.includes('lib/') || p.includes('app/'))) {
    structureScore += 15;
  }
  structureScore = Math.min(100, structureScore);

  let dependencyHealthScore = hasLockfile ? 90 : 60;

  // Compile deterministic suggestions
  const suggestions: StaticAnalysisResult['staticSuggestions'] = [];

  if (!hasReadme) {
    suggestions.push({
      category: 'Documentation',
      severity: 'high',
      filePath: 'README.md',
      description: 'Repository is missing a README. Interviewers evaluate clarity of setup and architecture.',
      suggestedFix: 'Add a comprehensive README.md covering project purpose, architecture, setup commands, and demo screenshots.',
    });
  }

  if (!hasLicense) {
    suggestions.push({
      category: 'Documentation',
      severity: 'low',
      filePath: 'LICENSE',
      description: 'No open-source license found.',
      suggestedFix: 'Add an open-source license (e.g. MIT or Apache-2.0) to clarify terms of usage.',
    });
  }

  if (!hasTests) {
    suggestions.push({
      category: 'Testing',
      severity: 'high',
      filePath: 'tests/',
      description: 'No automated tests detected in the repository.',
      suggestedFix: 'Implement unit and integration tests (e.g. Vitest, Jest, PyTest) covering core business logic and critical paths.',
    });
  }

  if (!hasCi) {
    suggestions.push({
      category: 'Git Hygiene',
      severity: 'med',
      filePath: '.github/workflows/ci.yml',
      description: 'No continuous integration (CI) pipeline configured.',
      suggestedFix: 'Set up GitHub Actions to automatically run linting, typechecking, and test suites on pull requests.',
    });
  }

  if (!hasGitignore) {
    suggestions.push({
      category: 'Git Hygiene',
      severity: 'high',
      filePath: '.gitignore',
      description: 'Missing .gitignore file; risk of committing node_modules, build artifacts, or secret keys.',
      suggestedFix: 'Add a standard .gitignore suited for your technology stack.',
    });
  }

  if (!hasLockfile) {
    suggestions.push({
      category: 'Dependency Health',
      severity: 'med',
      filePath: 'package-lock.json',
      description: 'No lockfile detected. Builds may be non-deterministic across environments.',
      suggestedFix: 'Commit package-lock.json, yarn.lock, or pnpm-lock.yaml to guarantee deterministic dependencies.',
    });
  }

  return {
    signals: {
      hasReadme,
      readmeSize: hasReadme ? 1024 : 0,
      hasLicense,
      hasGitignore,
      hasCi,
      ciProvider,
      hasTests,
      testFramework,
      hasLinter,
      linterConfig,
      hasLockfile,
      totalFiles: filePaths.length,
      sourceFilesCount: filePaths.filter((p) => /\.(ts|tsx|js|jsx|py|go|rs|java|cpp|rb)$/i.test(p)).length,
      topLanguages: {},
      commitCountAnalyzed: commitMessages.length,
    },
    deterministicScores: {
      docs: docsScore,
      testing: testingScore,
      gitHygiene: gitHygieneScore,
      structure: structureScore,
      dependencyHealth: dependencyHealthScore,
    },
    staticSuggestions: suggestions,
  };
}
