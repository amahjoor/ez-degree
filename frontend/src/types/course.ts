import { Professor } from './professor';

export interface Course {
  course_code: string;
  title: string;
  credits: number;
  description: string;
  subject: string;
  prerequisites: string | null;
  corequisites: string | null;
  restrictions: string | null;
  notes: string | null;
  professors: Professor[];
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
  isFirstDegreeConnection?: boolean;
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

// Enhanced types for local major data structure
export interface LocalMajorRequirement {
  [key: string]: any; // Flexible for complex nested structures
  url?: string;
  name?: string;
  hours?: number | null;
  footnotes?: string[];
}

export interface BooleanCourse {
  classes: { [key: string]: LocalMajorRequirement };
  boolword: string; // "or", "&", etc.
  hours: number | null;
}

export interface RequirementTable {
  classes: { [key: string]: LocalMajorRequirement | BooleanCourse };
  hours: number | null;
  footnotes: string[];
}

export interface RequirementCategory {
  pre_notes: string[];
  table: RequirementTable;
  footnotes: { [key: string]: string };
  post_notes: string[];
}

export interface LocalMajorData {
  banner: string;
  hours: string;
  requirements: { [categoryName: string]: RequirementCategory }[];
  catagories?: string[]; // Note: typo in original data
}

export interface ParsedCourse {
  code: string;
  name: string;
  credits: number | null;
  isRequired: boolean;
  isChoice: boolean;
  choiceGroup?: string;
  footnotes: string[];
  url?: string;
}

export interface ParsedRequirementGroup {
  title: string;
  description?: string;
  totalCredits?: number;
  courses: ParsedCourse[];
  subcategories?: ParsedRequirementGroup[];
  footnotes: { [key: string]: string };
  preNotes: string[];
  postNotes: string[];
}

export interface ParsedMajorData {
  banner: string;
  name: string;
  programType: 'Major' | 'Minor' | 'Certificate' | 'Graduate';
  degreeType: string; // BS, BA, MS, PhD, etc.
  totalCredits: string;
  college: string;
  categories: string[];
  requirementGroups: ParsedRequirementGroup[];
  concentrations: string[];
  hasConcentrations: boolean;
}

export interface ProgramTypeFilter {
  undergraduate: boolean;
  graduate: boolean;
  major: boolean;
  minor: boolean;
  certificate: boolean;
}

// Enhanced interfaces for the sidebar - will define specific props when updating components 