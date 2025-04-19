export interface Course {
  course_code: string;
  title: string;
  credits: number;
  description: string;
  subject: string;
}

export interface Subject {
  id: string;
  name: string;
  course_count: number;
}

// Degree requirements types
export type Major = {
  id: string;
  name: string;
};

export type Concentration = {
  id: string;
  name: string;
};

export type RequirementCourse = {
  code: string;
  title: string;
  credits: number;
  alternatives: any[];
  prerequisites?: string;
  corequisites?: string;
};

export type Category = {
  name: string;
  total_credits: number;
  courses: RequirementCourse[];
};

export type Requirements = {
  degree_name: string;
  total_credits: number;
  categories: Category[];
  concentrations?: any[];
};

// Define interfaces for our custom node data
export interface CourseNodeData {
  label: string;
  title?: string;
  credits?: number;
  prerequisites?: string;
  category?: string;
  categoryColor: string;
  isLabel?: boolean;
  relationshipToSelected?: string | null;
  isHighlighted?: boolean;
}

// Global window interface for course graph state
declare global {
  interface Window {
    courseGraphState?: {
      filteredCategories: string[];
      toggleCategoryFilter: (category: string) => void;
    };
  }
} 