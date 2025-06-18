import { Node as FlowNode, Edge as FlowEdge } from 'reactflow';
import { CourseNodeData } from './course';

// Define type for our node
export type CourseNode = Omit<FlowNode, 'data'> & {
  data: CourseNodeData;
};

// Define interface for our edge data
export interface EdgeData {
  id: string;
  type: string;
  isPrereq?: boolean;
  label?: string;
}

// Define type for our edge
export type CourseEdge = Omit<FlowEdge, 'data'> & {
  data: EdgeData;
};

// Flow Graph Component Props
export interface FlowGraphProps {
  elements: any[];
  categoryColors: Record<string, string>;
  initialFilteredCategories?: string[];
  connectionFilter?: number;
  showPrereqsCoreqs?: boolean;
  showUnlocks?: boolean;
} 