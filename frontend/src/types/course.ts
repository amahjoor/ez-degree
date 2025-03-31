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

export interface RequirementCourse {
  code: string;
  title: string;
  credits: number;
  alternatives: any[];
  prerequisites?: string;
  corequisites?: string;
}

export interface Category {
  name: string;
  total_credits: number;
  courses: RequirementCourse[];
}

export interface Requirements {
  degree_name: string;
  total_credits: number;
  categories: Category[];
  concentrations?: any[];
}

export interface Major {
  id: string;
  name: string;
}

export interface Concentration {
  id: string;
  name: string;
} 