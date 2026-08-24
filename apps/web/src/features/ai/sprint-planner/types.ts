export interface SprintTaskInput {
  id: string;
  title: string;
  priority: "low" | "medium" | "high" | "urgent";
  storyPoints?: number;
  estimatedHours?: number;
  dependencies?: string[];
}

export interface SprintPlannerRequest {
  sprintName: string;
  sprintGoal: string;
  capacityPoints: number;
  tasks: SprintTaskInput[];
}

export interface PlannedSprintTask extends SprintTaskInput {
  selected: boolean;
  reason: string;
}

export interface SprintPlannerResult {
  sprintName: string;
  goal: string;
  selectedTasks: PlannedSprintTask[];
  deferredTasks: PlannedSprintTask[];
  committedPoints: number;
  capacityUsed: number;
  utilization: number;
  recommendations: string[];
  generatedAt: string;
}