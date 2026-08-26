import { Edge as FlowEdge, Node as FlowNode } from 'reactflow';

export type ConnectionCounts = {
  prereq: number;
  coreq: number;
  unlock: number;
};

export type ConnectionIndex = {
  prereqsOf: Map<string, Set<string>>;
  unlockedBy: Map<string, Set<string>>;
  coreqsOf: Map<string, Set<string>>;
  neighbors: Map<string, Set<string>>;
  counts: Map<string, ConnectionCounts>;
};

function addToSet(map: Map<string, Set<string>>, key: string, value: string) {
  let bucket = map.get(key);
  if (!bucket) {
    bucket = new Set<string>();
    map.set(key, bucket);
  }
  bucket.add(value);
}

export function buildConnectionIndex(edges: FlowEdge[]): ConnectionIndex {
  const prereqsOf = new Map<string, Set<string>>();
  const unlockedBy = new Map<string, Set<string>>();
  const coreqsOf = new Map<string, Set<string>>();
  const neighbors = new Map<string, Set<string>>();

  for (const edge of edges) {
    const type = (edge.data as { type?: string } | undefined)?.type;
    if (type === 'coreq') {
      addToSet(coreqsOf, edge.source, edge.target);
      addToSet(coreqsOf, edge.target, edge.source);
    } else {
      addToSet(prereqsOf, edge.target, edge.source);
      addToSet(unlockedBy, edge.source, edge.target);
    }
    addToSet(neighbors, edge.source, edge.target);
    addToSet(neighbors, edge.target, edge.source);
  }

  const counts = new Map<string, ConnectionCounts>();
  const ids = new Set<string>([
    ...prereqsOf.keys(),
    ...unlockedBy.keys(),
    ...coreqsOf.keys(),
    ...neighbors.keys(),
  ]);

  for (const id of ids) {
    counts.set(id, {
      prereq: prereqsOf.get(id)?.size ?? 0,
      coreq: coreqsOf.get(id)?.size ?? 0,
      unlock: unlockedBy.get(id)?.size ?? 0,
    });
  }

  return { prereqsOf, unlockedBy, coreqsOf, neighbors, counts };
}

export function getConnectionCount(
  courseId: string,
  includePrereqsCoreqs: boolean,
  includeUnlocks: boolean,
  index: ConnectionIndex
): number {
  const counts = index.counts.get(courseId);
  if (!counts) return 0;
  let total = 0;
  if (includePrereqsCoreqs) total += counts.prereq + counts.coreq;
  if (includeUnlocks) total += counts.unlock;
  return total;
}

export function isAdjacentToMatchingNode(
  nodeId: string,
  index: ConnectionIndex,
  nodeById: Map<string, FlowNode>,
  shouldApplyCategoryFilter: boolean,
  filteredCategories: string[],
  shouldApplyConnectionFilter: boolean,
  showPrereqsCoreqs: boolean,
  showUnlocks: boolean,
  connectionFilter: number
): boolean {
  const neighbors = index.neighbors.get(nodeId);
  if (!neighbors) return false;

  for (const neighborId of neighbors) {
    const neighbor = nodeById.get(neighborId);
    if (!neighbor) continue;

    const nodeCategory = (neighbor.data as { category?: string } | undefined)?.category || '';
    const matchesCategory = !shouldApplyCategoryFilter || filteredCategories.includes(nodeCategory);

    let matchesConnectionFilter = true;
    if (shouldApplyConnectionFilter) {
      matchesConnectionFilter =
        getConnectionCount(neighborId, showPrereqsCoreqs, showUnlocks, index) >= connectionFilter;
    }

    if (matchesCategory && matchesConnectionFilter) {
      return true;
    }
  }

  return false;
}
