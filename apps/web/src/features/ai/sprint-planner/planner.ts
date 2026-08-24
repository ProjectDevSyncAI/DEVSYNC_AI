import type {
  PlannedSprintTask,
  SprintPlannerRequest,
  SprintPlannerResult,
  SprintTaskInput,
} from "./types";

const priorityWeight: Record<
  SprintTaskInput["priority"],
  number
> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function sortTasks(tasks: SprintTaskInput[]): SprintTaskInput[] {
  return [...tasks].sort((a, b) => {
    const priorityDifference =
      priorityWeight[b.priority] -
      priorityWeight[a.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return (b.storyPoints ?? 1) - (a.storyPoints ?? 1);
  });
}

export function planSprint(
  request: SprintPlannerRequest,
): SprintPlannerResult {
  const sorted = sortTasks(request.tasks);

  let usedCapacity = 0;

  const selectedTasks: PlannedSprintTask[] = [];
  const deferredTasks: PlannedSprintTask[] = [];

  for (const task of sorted) {
    const points = task.storyPoints ?? 1;

    if (usedCapacity + points <= request.capacityPoints) {
      usedCapacity += points;

      selectedTasks.push({
        ...task,
        selected: true,
        reason: "Fits within sprint capacity and priority.",
      });
    } else {
      deferredTasks.push({
        ...task,
        selected: false,
        reason: "Deferred because available sprint capacity is limited.",
      });
    }
  }

  const utilization =
    request.capacityPoints > 0
      ? Math.round(
          (usedCapacity / request.capacityPoints) * 100,
        )
      : 0;

  const recommendations: string[] = [];

  if (utilization < 70) {
    recommendations.push(
      "Sprint capacity is under-utilized. Consider pulling in additional high-priority work.",
    );
  }

  if (utilization > 100) {
    recommendations.push(
      "Sprint commitment exceeds recommended capacity.",
    );
  }

  if (deferredTasks.length > 0) {
    recommendations.push(
      `${deferredTasks.length} task(s) were deferred and should be reviewed for the next sprint.`,
    );
  }

  return {
    sprintName: request.sprintName,
    goal: request.sprintGoal,
    selectedTasks,
    deferredTasks,
    committedPoints: usedCapacity,
    capacityUsed: usedCapacity,
    utilization,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}