import type {
  AIInsight,
  InsightsRequest,
  InsightsResult,
} from "./types";

export function calculateProjectHealth(
  request: InsightsRequest,
): number {
  let score = 100;

  if (request.totalTasks > 0) {
    const completion =
      request.completedTasks / request.totalTasks;

    score -= (1 - completion) * 25;
  }

  if (request.blockedTasks > 0) {
    score -= Math.min(request.blockedTasks * 4, 20);
  }

  if (request.overdueTasks > 0) {
    score -= Math.min(request.overdueTasks * 5, 25);
  }

  if (request.teamMembers === 0) {
    score -= 20;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function generateInsights(
  request: InsightsRequest,
): InsightsResult {
  const insights: AIInsight[] = [];
  const now = new Date().toISOString();

  const completion =
    request.totalTasks > 0
      ? request.completedTasks / request.totalTasks
      : 0;

  if (completion >= 0.8) {
    insights.push({
      id: crypto.randomUUID(),
      title: "Strong delivery momentum",
      description:
        "The project is maintaining a high task completion rate.",
      category: "delivery",
      severity: "success",
      confidence: 0.91,
      impact: "Positive delivery confidence",
      recommendation:
        "Maintain the current sprint rhythm and protect the team from scope creep.",
      createdAt: now,
    });
  }

  if (request.blockedTasks > 0) {
    insights.push({
      id: crypto.randomUUID(),
      title: "Blocked work detected",
      description: `${request.blockedTasks} task(s) are currently blocked.`,
      category: "risk",
      severity: request.blockedTasks >= 5 ? "critical" : "warning",
      confidence: 0.94,
      impact: "May reduce sprint velocity",
      recommendation:
        "Review blockers during standup and assign owners to unblock them.",
      createdAt: now,
    });
  }

  if (request.overdueTasks > 0) {
    insights.push({
      id: crypto.randomUUID(),
      title: "Overdue work requires attention",
      description: `${request.overdueTasks} task(s) are past their expected due date.`,
      category: "productivity",
      severity: "warning",
      confidence: 0.96,
      impact: "Potential delivery delay",
      recommendation:
        "Re-evaluate overdue tasks and adjust priority or ownership.",
      createdAt: now,
    });
  }

  return {
    projectId: request.projectId,
    insights,
    healthScore: calculateProjectHealth(request),
    generatedAt: now,
  };
}