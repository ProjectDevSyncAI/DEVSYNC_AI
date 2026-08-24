import type {
  ProjectRisk,
  RiskAnalysisRequest,
  RiskAnalysisResult,
  RiskLevel,
} from "./types";

function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export function calculateRiskScore(
  request: RiskAnalysisRequest,
): number {
  let score = 0;

  score += Math.min(request.overdueTasks * 8, 30);
  score += Math.min(request.blockedTasks * 10, 30);
  score += Math.min(request.unresolvedIssues * 4, 20);
  score += Math.min(request.openPullRequests * 3, 10);

  if (request.plannedWork > request.teamCapacity) {
    score += 15;
  }

  return Math.min(100, score);
}

export function analyzeProjectRisk(
  request: RiskAnalysisRequest,
): RiskAnalysisResult {
  const risks: ProjectRisk[] = [];
  const now = new Date().toISOString();

  if (request.overdueTasks > 0) {
    const riskScore = Math.min(
      100,
      request.overdueTasks * 8,
    );

    risks.push({
      id: crypto.randomUUID(),
      title: "Schedule delay",
      description:
        "Overdue tasks indicate a potential delivery delay.",
      category: "schedule",
      level: getRiskLevel(riskScore),
      probability: Math.min(100, request.overdueTasks * 12),
      impact: 75,
      riskScore,
      mitigation:
        "Review overdue work and re-plan tasks with the highest delivery impact.",
      createdAt: now,
    });
  }

  if (request.blockedTasks > 0) {
    const riskScore = Math.min(
      100,
      request.blockedTasks * 10,
    );

    risks.push({
      id: crypto.randomUUID(),
      title: "Blocked work accumulation",
      description:
        "Blocked tasks may create downstream delivery bottlenecks.",
      category: "dependency",
      level: getRiskLevel(riskScore),
      probability: Math.min(100, request.blockedTasks * 15),
      impact: 80,
      riskScore,
      mitigation:
        "Assign blocker owners and track resolution during daily standups.",
      createdAt: now,
    });
  }

  if (request.plannedWork > request.teamCapacity) {
    risks.push({
      id: crypto.randomUUID(),
      title: "Capacity overload",
      description:
        "Planned work exceeds the available team capacity.",
      category: "resource",
      level: "high",
      probability: 85,
      impact: 75,
      riskScore: 78,
      mitigation:
        "Reduce scope, increase capacity, or move lower-priority work.",
      createdAt: now,
    });
  }

  const score = calculateRiskScore(request);

  return {
    projectId: request.projectId,
    overallRisk: getRiskLevel(score),
    score,
    risks,
    analyzedAt: now,
  };
}