import { Major, Concentration, Requirements } from '@/types/course';

export interface CourseDetails {
  course_code: string;
  title: string;
  credits: number;
  description?: string;
  professors?: Array<{
    firstName: string;
    lastName: string;
    avgRating: number;
    reviews?: Array<{
      grade?: string;
    }>;
  }>;
  mostCommonGrade?: string;
  totalReviews?: number;
}

export interface RequirementGroup {
  title: string;
  isOpen: boolean;
  options?: string[];
  selectedOption?: string;
  isChoice?: boolean;
  requirements?: Requirement[];
}

export interface Requirement {
  id: string;
  title: string;
  completed: boolean;
  credits?: number;
}

export interface MajorOption {
  value: string;
  label: string;
}

export interface DegreeRequirementsSidebarProps {
  isApiAvailable: boolean;
  onCourseSelect?: (courseCode: string, title: string, credits: number) => void;
  onApiConnectionRetry?: () => void;
}

export interface MajorSelectorProps {
  loading: boolean;
  majors: Major[];
  selectedMajor: string;
  concentrations: Concentration[];
  selectedConcentration: string;
  onMajorChange: (major: string) => void;
  onConcentrationChange: (concentration: string) => void;
  showMajorSelect: boolean;
  setShowMajorSelect: (show: boolean) => void;
}

export interface RequirementsListProps {
  loading: boolean;
  requirementsError: string;
  requirementGroups: RequirementGroup[];
  requirements: Requirements | null;
  showMajorSelect: boolean;
  onGroupToggle: (index: number) => void;
  onOptionSelect: (groupIndex: number, option: string) => void;
  onRequirementClick: (requirement: Requirement, event: React.MouseEvent) => void;
  onRequirementDragStart: (e: React.DragEvent, requirement: Requirement) => void;
}

export interface RequirementGroupProps {
  group: RequirementGroup;
  index: number;
  onToggle: () => void;
  onOptionSelect: (option: string) => void;
  onRequirementClick: (requirement: Requirement, event: React.MouseEvent) => void;
  onRequirementDragStart: (e: React.DragEvent, requirement: Requirement) => void;
}

export interface CourseOverlayProps {
  courseCode: string;
  position: { x: number; y: number };
  onClose: () => void;
} 