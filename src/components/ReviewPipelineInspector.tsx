import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  FileCode2, 
  Cpu, 
  Activity,
  Layers,
  ArrowRight,
  UserCheck,
  Check,
  ThumbsUp,
  ThumbsDown,
  Lock,
  Scale,
  BrainCircuit,
  FileCheck
} from 'lucide-react';
import { BugFixRun } from '../types';

interface ReviewPipelineInspectorProps {
  run: BugFixRun | null;
  onClose: () => void;
  onApproveFix?: (runId: string) => void;
  onRejectFix?: (runId: string) => void;
  onOpenThoughtStream?: (run: BugFixRun) => void;
}

export const ReviewPipelineInspector: React.FC<ReviewPipelineInspectorProps> = ({ 
  run, 
  onClose,
  onApproveFix,
  onRejectFix,
  onOpenThoughtStream
}) => {
  const [humanApproved, setHumanApproved] = useState(false);

  if (!run) return null;

  const pipeline = run.pipeline;
  const hasPipelineEvidence = Boolean(pipeline && (pipeline.overallScore > 0 || pipeline.astSyntaxCheck || pipeline.unitTestVerification));

  const handleApprove = () => {
    setHumanApproved(true);
    onApproveFix?.(run.id);
  };

  const stages = [
    {
      step: 1,
      name: 'AST Syntax & Static Analysis',
      icon: Layers,
      status: pipeline?.astSyntaxCheck?.status || 'warning',
      score: pipeline?.astSyntaxCheck?.score ?? 0,
      description: pipeline?.astSyntaxCheck?.message || 'Not executed or not verified for this run.',
      details: 'No independent AST/type-check result is stored in this run.'
    },
    {
      step: 2,
      name: 'Security SAST & CVE Scan',
      icon: ShieldCheck,
      status: pipeline?.securityVulnerabilityScan?.status || 'warning',
      score: pipeline?.securityVulnerabilityScan?.score ?? 0,
      description: pipeline?.securityVulnerabilityScan?.vulnerabilitiesFound?.length
        ? `Reported findings: ${pipeline.securityVulnerabilityScan.vulnerabilitiesFound.join(', ')}`
        : 'Not executed or no findings evidence was stored.',
      details: 'This screen does not substitute for a repository SAST/CVE runner.'
    },
    {
      step: 3,
      name: 'Legal & Intellectual Property Compliance Shield',
      icon: Scale,
      status: pipeline?.legalRiskCheck?.status || 'warning',
      score: pipeline?.legalRiskCheck?.score ?? 0,
      description: pipeline?.legalRiskCheck?.legalSignoffSummary || 'No independent legal, license, or secret-scan evidence was stored.',
      details: pipeline?.legalRiskCheck?.complianceFrameworks?.length ? `Reported frameworks: ${pipeline.legalRiskCheck.complianceFrameworks.join(', ')}.` : 'No compliance framework assessment is available.'
    },
    {
      step: 4,
      name: 'Dependency Supply-Chain Audit',
      icon: FileCheck,
      status: pipeline?.dependencyCheck?.status || 'warning',
      score: pipeline?.dependencyCheck?.score ?? 0,
      description: pipeline?.dependencyCheck ? `${pipeline.dependencyCheck.dependenciesAudited} dependencies audited in the recorded result.` : 'Not executed or not verified for this run.',
      details: 'No live package or lockfile audit is performed by this inspector.'
    },
    {
      step: 5,
      name: 'Automated Unit Test & Regression Runner',
      icon: Terminal,
      status: pipeline?.unitTestVerification?.status || 'warning',
      score: pipeline?.unitTestVerification?.score ?? 0,
      description: pipeline?.unitTestVerification ? `${pipeline.unitTestVerification.testsPassed}/${pipeline.unitTestVerification.testsRun} recorded tests passed.` : 'Not executed / not verified.',
      details: 'D-Bugger does not claim remote CI results unless they are explicitly returned and stored.'
    },
    {
      step: 6,
      name: 'Confidence Gate & Human Review Gate',
      icon: UserCheck,
      status: pipeline?.passed ? 'passed' : 'warning',
      score: pipeline?.overallScore ?? 0,
      description: hasPipelineEvidence ? `Recorded pipeline result: ${pipeline?.overallScore ?? 0}/100. Human review is still required before merge.` : 'No complete pipeline result is available for this run.',
      details: `Model response: ${run.modelUsed || 'not recorded'}. This inspector does not certify safety or merge readiness.`
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden my-8 text-[#121212]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black bg-[#F9F7F2] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-emerald-200 text-emerald-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-serif-heading text-lg font-bold uppercase tracking-tight text-[#121212]">
                Repository Evidence Inspector
              </h3>
              <p className="text-xs font-sans text-[#121212]/70">
                6-Stage Evidence Review for <span className="font-mono font-bold text-black">{run.repoName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenThoughtStream && (
              <button
                onClick={() => onOpenThoughtStream(run)}
                className="flex items-center gap-1.5 border-2 border-black bg-purple-100 hover:bg-purple-200 text-purple-950 px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all"
              >
                <BrainCircuit className="h-4 w-4 text-purple-800" />
                View AI Thoughts
              </button>
            )}

            <button
              onClick={onClose}
              className="border border-black bg-white p-1.5 text-[#121212] hover:bg-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Pipeline Score Header */}
        <div className="flex items-center justify-between border-b-2 border-black bg-[#F9F7F2]/60 px-6 py-4 font-sans">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#121212]/70">Pipeline Pass Status</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-emerald-950 bg-emerald-200 px-2.5 py-0.5 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                {pipeline?.passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />} {pipeline?.passed ? 'Reported gate passed' : 'Review required; gate not verified'}
              </span>
              <span className="text-xs font-mono text-[#121212]/80">
                via <strong className="text-black font-mono">{run.modelUsed}</strong>
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#121212]/70">Recorded Pipeline Score</div>
            <div className="text-3xl font-bold font-serif-heading text-[#121212] tracking-tight">
              {pipeline?.overallScore ?? 0}/100
            </div>
          </div>
        </div>

        {/* 6 Stages List */}
        <div className="p-6 space-y-3.5 max-h-[460px] overflow-y-auto bg-white font-sans">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.step}
                className="border-2 border-black bg-[#F9F7F2] p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 items-center justify-center bg-black text-[#F9F7F2] font-mono font-bold text-xs border border-black shrink-0">
                      {stage.step}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wide text-[#121212] flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-black" />
                        {stage.name}
                        <span className="text-[10px] text-[#121212] font-mono font-bold bg-white px-2 py-0.5 border border-black">
                          Score: {stage.score}%
                        </span>
                      </h4>
                      <p className="text-xs text-[#121212]/90 mt-1">
                        {stage.description}
                      </p>
                      <p className="text-[11px] text-[#121212]/60 mt-0.5 font-mono">
                        {stage.details}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-950 bg-emerald-200 px-2 py-0.5 border border-black">
                      {stage.status === 'passed' ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />} {stage.status === 'passed' ? 'Reported passed' : stage.status === 'failed' ? 'Failed' : 'Not verified'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Optional Human In The Loop Review Approval Box */}
          <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-black" />
                <span className="text-xs font-bold uppercase text-[#121212]">Human Review Sign-Off</span>
              </div>
              
              {humanApproved ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-950 bg-emerald-200 px-2 py-0.5 border border-black">
                  <Check className="h-3.5 w-3.5" /> Approved by Developer
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleApprove}
                    className="flex items-center gap-1 border border-black bg-emerald-200 text-emerald-950 px-3 py-1 text-xs font-sans font-bold uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-300"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" /> Record Review Decision
                  </button>
                  <button
                    onClick={onClose}
                    className="flex items-center gap-1 border border-black bg-white px-3 py-1 text-xs font-sans font-bold uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-100"
                  >
                    <ThumbsDown className="h-3.5 w-3.5 text-red-600" /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t-2 border-black bg-[#F9F7F2] px-6 py-3">
          <span className="text-xs font-mono text-[#121212]/70">
            Evidence shown here is run output only; no CI, legal clearance, merge, or GitHub mutation is implied unless separately verified.
          </span>

          <button
            onClick={onClose}
            className="border border-black bg-white px-4 py-1.5 text-xs font-sans font-bold uppercase tracking-wider text-[#121212] hover:bg-[#F9F7F2] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
