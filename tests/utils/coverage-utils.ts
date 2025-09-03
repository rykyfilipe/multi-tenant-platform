// Coverage utilities for test optimization

export interface CoverageReport {
  total: {
    lines: { total: number; covered: number; skipped: number; pct: number }
    functions: { total: number; covered: number; skipped: number; pct: number }
    branches: { total: number; covered: number; skipped: number; pct: number }
    statements: { total: number; covered: number; skipped: number; pct: number }
  }
  [file: string]: any
}

export interface CoverageThreshold {
  global: {
    branches: number
    functions: number
    lines: number
    statements: number
  }
}

export const DEFAULT_COVERAGE_THRESHOLD: CoverageThreshold = {
  global: {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
}

export function analyzeCoverageGaps(report: CoverageReport): string[] {
  const gaps: string[] = []
  
  // Check overall coverage
  if (report.total.lines.pct < 90) {
    gaps.push(`Lines coverage: ${report.total.lines.pct}% (target: 90%)`)
  }
  
  if (report.total.functions.pct < 90) {
    gaps.push(`Functions coverage: ${report.total.functions.pct}% (target: 90%)`)
  }
  
  if (report.total.branches.pct < 90) {
    gaps.push(`Branches coverage: ${report.total.branches.pct}% (target: 90%)`)
  }
  
  if (report.total.statements.pct < 90) {
    gaps.push(`Statements coverage: ${report.total.statements.pct}% (target: 90%)`)
  }
  
  // Check individual file coverage
  Object.keys(report).forEach(file => {
    if (file === 'total') return
    
    const fileCoverage = report[file]
    if (fileCoverage.lines.pct < 80) {
      gaps.push(`File ${file}: ${fileCoverage.lines.pct}% lines coverage`)
    }
  })
  
  return gaps
}

export function generateCoverageReport(report: CoverageReport): string {
  const gaps = analyzeCoverageGaps(report)
  
  let reportText = '# Coverage Report\n\n'
  
  reportText += '## Overall Coverage\n\n'
  reportText += `- **Lines**: ${report.total.lines.pct}% (${report.total.lines.covered}/${report.total.lines.total})\n`
  reportText += `- **Functions**: ${report.total.functions.pct}% (${report.total.functions.covered}/${report.total.functions.total})\n`
  reportText += `- **Branches**: ${report.total.branches.pct}% (${report.total.branches.covered}/${report.total.branches.total})\n`
  reportText += `- **Statements**: ${report.total.statements.pct}% (${report.total.statements.covered}/${report.total.statements.total})\n\n`
  
  if (gaps.length > 0) {
    reportText += '## Coverage Gaps\n\n'
    gaps.forEach(gap => {
      reportText += `- ${gap}\n`
    })
    reportText += '\n'
  }
  
  reportText += '## File Coverage\n\n'
  Object.keys(report).forEach(file => {
    if (file === 'total') return
    
    const fileCoverage = report[file]
    const status = fileCoverage.lines.pct >= 80 ? '✅' : '❌'
    reportText += `${status} **${file}**: ${fileCoverage.lines.pct}%\n`
  })
  
  return reportText
}

export function getUncoveredFiles(report: CoverageReport): string[] {
  const uncoveredFiles: string[] = []
  
  Object.keys(report).forEach(file => {
    if (file === 'total') return
    
    const fileCoverage = report[file]
    if (fileCoverage.lines.pct < 80) {
      uncoveredFiles.push(file)
    }
  })
  
  return uncoveredFiles
}

export function getLowCoverageFiles(report: CoverageReport, threshold: number = 80): string[] {
  const lowCoverageFiles: string[] = []
  
  Object.keys(report).forEach(file => {
    if (file === 'total') return
    
    const fileCoverage = report[file]
    if (fileCoverage.lines.pct < threshold) {
      lowCoverageFiles.push(file)
    }
  })
  
  return lowCoverageFiles
}

export function calculateCoverageScore(report: CoverageReport): number {
  const weights = {
    lines: 0.4,
    functions: 0.3,
    branches: 0.2,
    statements: 0.1,
  }
  
  const score = 
    report.total.lines.pct * weights.lines +
    report.total.functions.pct * weights.functions +
    report.total.branches.pct * weights.branches +
    report.total.statements.pct * weights.statements
  
  return Math.round(score * 100) / 100
}

export function getCoverageTrend(current: CoverageReport, previous: CoverageReport): {
  lines: number
  functions: number
  branches: number
  statements: number
  overall: number
} {
  return {
    lines: current.total.lines.pct - previous.total.lines.pct,
    functions: current.total.functions.pct - previous.total.functions.pct,
    branches: current.total.branches.pct - previous.total.branches.pct,
    statements: current.total.statements.pct - previous.total.statements.pct,
    overall: calculateCoverageScore(current) - calculateCoverageScore(previous),
  }
}

export function generateCoverageBadge(report: CoverageReport): string {
  const score = calculateCoverageScore(report)
  const color = score >= 90 ? 'green' : score >= 80 ? 'yellow' : 'red'
  
  return `![Coverage](https://img.shields.io/badge/coverage-${score}%25-${color})`
}

export function validateCoverageThreshold(report: CoverageReport, threshold: CoverageThreshold): boolean {
  return (
    report.total.lines.pct >= threshold.global.lines &&
    report.total.functions.pct >= threshold.global.functions &&
    report.total.branches.pct >= threshold.global.branches &&
    report.total.statements.pct >= threshold.global.statements
  )
}

export function getCoverageRecommendations(report: CoverageReport): string[] {
  const recommendations: string[] = []
  
  if (report.total.branches.pct < 90) {
    recommendations.push('Add more test cases to cover conditional branches')
  }
  
  if (report.total.functions.pct < 90) {
    recommendations.push('Write tests for uncovered functions')
  }
  
  if (report.total.lines.pct < 90) {
    recommendations.push('Add tests to cover uncovered lines of code')
  }
  
  // Check for specific file patterns
  const uncoveredFiles = getUncoveredFiles(report)
  if (uncoveredFiles.length > 0) {
    recommendations.push(`Focus on improving coverage for: ${uncoveredFiles.slice(0, 5).join(', ')}`)
  }
  
  return recommendations
}
