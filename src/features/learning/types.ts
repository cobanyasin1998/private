import type {
  EnglishEntryType,
  EnglishSkill,
  LearningAreaGroup,
  LearningAreaLevel,
  LearningAreaStatus,
  LearningItemType,
  LearningTodoPriority,
  LearningTodoStatus,
  TravelPlaceStatus,
  TravelPriority,
} from "@prisma/client";

export type LearningAreaRegistryEntry = {
  slug: string;
  name: string;
  group: LearningAreaGroup;
  category: string;
  description: string;
  defaultLevel?: LearningAreaLevel;
};

export type LearningItemListItem = {
  id: string;
  areaId: string;
  parentId: string | null;
  title: string;
  description: string | null;
  summary: string | null;
  content: string | null;
  requirements: string | null;
  goals: string | null;
  type: LearningItemType;
  position: number;
  estimatedMinutes: number | null;
  notes: string | null;
  externalUrl: string | null;
  completedAt: string | null;
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
  todos: LearningTodoItem[];
  learningNotes: LearningNoteItem[];
  learningGoals: LearningGoalItem[];
};

export type LearningTodoItem = {
  id: string;
  areaId: string;
  itemId: string | null;
  title: string;
  description: string | null;
  status: LearningTodoStatus;
  priority: LearningTodoPriority;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LearningStudySessionItem = { id: string; startedAt: string; endedAt: string | null; minutes: number; note: string | null };
export type LearningNoteItem = { id: string; title: string; content: string; learningAreaId: string | null; learningItemId: string | null; createdAt: string; updatedAt: string };
export type LearningGoalItem = { id: string; title: string; description: string | null; learningAreaId?: string | null; learningItemId: string | null; dueDate: string | null; completedAt: string | null };

export type LearningAreaListItem = {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  description: string | null;
  group: LearningAreaGroup;
  category: string | null;
  subCategory: string | null;
  level: LearningAreaLevel;
  status: LearningAreaStatus;
  progress: number;
  estimatedMinutes: number | null;
  prerequisites: string | null;
  notes: string | null;
  lastWorkedAt: string | null;
  completedAt: string | null;
  englishLevel: string | null;
  resourceUrls: string[];
  tagIds: string[];
  items: LearningItemListItem[];
  todos: LearningTodoItem[];
  totalMinutes: number;
  completedItems: number;
  createdAt: string;
  updatedAt: string;
  sessions: LearningStudySessionItem[];
  learningNotes: LearningNoteItem[];
  learningGoals: LearningGoalItem[];
  englishSkills: EnglishSkillProgressItem[];
  englishEntries: LearningEnglishEntryItem[];
};

export type LearningStats = {
  totalAreas: number;
  activeAreas: number;
  completedAreas: number;
  averageProgress: number;
  totalMinutes: number;
  completedItems: number;
  totalItems: number;
  weeklyMinutes: number;
  upcomingGoals: number;
};

export type TravelPlaceListItem = {
  id: string;
  placeName: string;
  city: string | null;
  country: string | null;
  status: TravelPlaceStatus;
  priority: TravelPriority;
  estimatedBudget: number | null;
  currency: string;
  notes: string | null;
  photoUrl: string | null;
  externalUrl: string | null;
  visitedAt: string | null;
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type EnglishSkillProgressItem = {
  id: string;
  areaId: string;
  skill: EnglishSkill;
  level: string | null;
  progress: number;
  assessedAt: string | null;
};

export type LearningEnglishEntryItem = {
  id: string;
  areaId: string;
  type: EnglishEntryType;
  title: string;
  content: string | null;
  notes: string | null;
  progress: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
