export interface ContributorInfo {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'ai_coauthor' | 'lead_maintainer' | 'committer' | 'security_auditor';
  commitsCount: number;
  patchesSynthesized?: number;
  verifiedGpg: boolean;
  isAiAgent?: boolean;
}

export interface RepoContextAnalysis {
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  indexedAt: number;
  techStack: {
    language: string;
    frameworks: string[];
    packageManager: string;
    runtime: string;
  };
  filesIndexed: number;
  symbolCount: number;
  astHealthScore: number; // 0-100
  criticalModules: Array<{
    file: string;
    complexity: 'high' | 'medium' | 'low';
    riskFactor: string;
  }>;
  vulnerabilityHotspots: Array<{
    category: string;
    file: string;
    risk: 'critical' | 'high' | 'medium';
    description: string;
  }>;
  architectureSummary: string;
  contributorSignature: string;
}

export interface AgentConsoleToolCall {
  id: string;
  timestamp: number;
  command: string;
  category: 'mcp' | 'git' | 'ast' | 'test' | 'ai_reasoning' | 'legal_audit';
  status: 'running' | 'success' | 'failed';
  output: string;
  durationMs: number;
  tokensStreamed?: number;
}

export interface AgentConsoleMessage {
  id: string;
  timestamp: number;
  sender: 'agent' | 'system' | 'user' | 'pipeline';
  text: string;
  toolCall?: AgentConsoleToolCall;
  thought?: string;
  codeSnippet?: {
    file: string;
    code: string;
    language: string;
  };
}

export interface MonitoredRepo {
  id: string;
  name: string; // e.g. "acme/auth-service"
  owner: string;
  repo: string;
  branch: string; // e.g. "main"
  url: string;
  isLive: boolean;
  status: 'monitoring' | 'analyzing' | 'fixing' | 'idle' | 'error';
  autoMode: 'pr_only' | 'pr_and_push' | 'review_required';
  autoSweepOnPush?: boolean;
  includeCoAuthorAttribution?: boolean;
  openRouterModel: string;
  securityThreshold: number; // e.g. 85 (out of 100)
  lastCommitSha?: string;
  lastCommitMessage?: string;
  lastCheckedAt: number;
  totalFixes: number;
  emailAlerts: boolean;
  alertEmail?: string;
  slackAlerts?: boolean;
  slackWebhookUrl?: string;
  isMockDemo?: boolean;
  requiresHumanApproval?: boolean;
  contextAnalysis?: RepoContextAnalysis;
  contributors?: ContributorInfo[];
  isAnalyzingContext?: boolean;
}

export interface AgentThoughtStep {
  id: string;
  phase: 'ast_ingestion' | 'hypothesis_generation' | 'root_cause_deduction' | 'patch_synthesis' | 'legal_risk_audit' | 'unit_test_run' | 'self_correction' | 'mcp_delivery';
  timestamp: number;
  title: string;
  thought: string;
  confidence: number;
  astNodeInvestigated?: string;
  codeInspection?: string;
  verdict: 'passed' | 'warning' | 'rejected' | 'synthesizing' | 'success';
}

export interface LegalRiskAudit {
  status: 'passed' | 'warning' | 'failed';
  score: number;
  licenseContamination: {
    status: 'passed' | 'warning' | 'failed';
    detectedLicenses: string[];
    viralRisk: boolean;
    detail: string;
  };
  secretLeakGuard: {
    status: 'passed' | 'failed';
    secretsFound: string[];
    detail: string;
  };
  copyrightIntegrity: {
    status: 'passed' | 'warning';
    uncreditedCopyDetected: boolean;
    detail: string;
  };
  complianceFrameworks: string[]; // e.g. ['SOC2 Type II', 'GDPR Art. 32', 'OWASP ASVS']
  legalSignoffSummary: string;
}

export interface AgentStepTrace {
  id: string;
  phase: 'ast_ingestion' | 'cve_analysis' | 'patch_synthesis' | 'security_pipeline' | 'legal_compliance' | 'self_correction' | 'mcp_delivery';
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  timestamp: number;
  detail: string;
  durationMs?: number;
}

export interface BugFixRun {
  id: string;
  repoId: string;
  repoName: string;
  commitSha: string;
  commitMessage: string;
  commitAuthor: string;
  timestamp: number;
  status: 'detected' | 'analyzing' | 'pipeline_validating' | 'pr_created' | 'pushed' | 'undone' | 'rejected' | 'failed' | 'awaiting_human_review';
  
  // Bug details
  bugCategory: 'memory_leak' | 'security_cve' | 'race_condition' | 'null_pointer' | 'syntax_error' | 'infinite_loop' | 'logic_flaw' | 'other';
  bugSeverity: 'critical' | 'high' | 'medium' | 'low';
  bugTitle: string;
  bugDescription: string;
  affectedFiles: string[];
  
  // Agentic Fixing & Thought Stream
  modelUsed: string;
  modelContextTokens?: number;
  aiReasoning: string;
  aiThoughtStream?: AgentThoughtStep[];
  patchDiff: string;
  fixedCodeSnippet?: string;
  originalCodeSnippet?: string;
  agentSteps?: AgentStepTrace[];
  selfCorrectionAttempts?: number;
  
  // Secure Code Review & Legal Compliance Pipeline
  pipeline: {
    passed: boolean;
    overallScore: number;
    astSyntaxCheck: { status: 'passed' | 'failed' | 'warning'; message: string; score: number };
    securityVulnerabilityScan: { status: 'passed' | 'failed' | 'warning'; vulnerabilitiesFound: string[]; score: number };
    legalRiskCheck: LegalRiskAudit;
    unitTestVerification: { status: 'passed' | 'failed' | 'warning'; testsRun: number; testsPassed: number; generatedTestSnippet?: string; score: number };
    dependencyCheck?: { status: 'passed' | 'failed' | 'warning'; dependenciesAudited: number; score: number };
    breakingChangeCheck: { status: 'passed' | 'failed' | 'warning'; apiContractsPreserved: boolean; score: number };
    regressionGuard: { status: 'passed' | 'failed' | 'warning'; confidence: number };
    humanReviewGate?: { status: 'approved' | 'pending' | 'rejected'; reviewedBy?: string; reviewedAt?: number };
  };

  // GitHub & MCP outputs
  branchName: string;
  pullRequestUrl?: string;
  pullRequestNumber?: number;
  pushedCommitSha?: string;
  coAuthorAttribution?: string;
  contextAnalysisSnapshot?: RepoContextAnalysis;
  mcpToolLogs: Array<{ tool: string; timestamp: number; input?: any; output?: any }>;
  
  // Alert dispatch status
  emailSent: boolean;
  emailSentAt?: number;
  emailRecipient?: string;
  slackSent?: boolean;
  slackSentAt?: number;
  
  // Undo & Manual Revert metadata
  canUndo: boolean;
  isUndone?: boolean;
  undoneAt?: number;
  undoReason?: string;
  revertPrUrl?: string;
  manualRevertCommands?: string[];
}

export interface InAppNotification {
  id: string;
  timestamp: number;
  type: 'fix_success' | 'security_gate' | 'pr_created' | 'rollback' | 'slack_alert' | 'error' | 'info';
  title: string;
  message: string;
  repoName?: string;
  prUrl?: string;
  read: boolean;
}

export interface DaemonLog {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success' | 'mcp' | 'ai';
  repoName?: string;
  message: string;
  details?: any;
}

export interface DaemonConfig {
  isRunning: boolean;
  pollIntervalSec: number;
  globalOpenRouterModel: string;
  defaultAutoMode: 'pr_only' | 'pr_and_push' | 'review_required';
  recipientEmail: string;
  slackWebhookUrl: string;
  emailOnEachFix: boolean;
  emailDailyDigest: boolean;
  strictSecurityGate: boolean;
  minSecurityScore: number;
  githubTokenConfigured: boolean;
  openRouterKeyConfigured: boolean;
  browserNotificationsEnabled: boolean;
  lastPulseAt: number;
  totalCommitsAnalyzed: number;
  totalBugsFixed: number;
  totalUndone: number;
}

export interface OpenRouterModelOption {
  id: string;
  name: string;
  contextLength: string;
  isFree: boolean;
  provider: string;
  recommendedFor: string;
  badge?: string;
}

export interface EmailReport {
  id: string;
  timestamp: number;
  recipient: string;
  subject: string;
  summary: string;
  fixesIncluded: string[]; // fix IDs
  failedFixes?: string[];
  status: 'sent' | 'queued' | 'simulated';
  htmlContent: string;
}

export interface UndoSnapshot {
  id: string;
  fixId: string;
  repoName: string;
  originalCommitSha: string;
  fixCommitSha?: string;
  prNumber?: number;
  branchName: string;
  revertDiff: string;
  revertPrUrl?: string;
  manualCommands: string[];
  status: 'active' | 'reverted';
  createdAt: number;
  revertedAt?: number;
}
