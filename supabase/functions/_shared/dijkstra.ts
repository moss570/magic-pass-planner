// ═══════════════════════════════════════════════════════════════════════════════
// Dijkstra's shortest path + passing point collection
// ═══════════════════════════════════════════════════════════════════════════════

import type { PathGraph, PathNode, PassingPoint } from "./types.ts";

interface DijkstraResult {
  path: string[];
  distanceM: number;
}

export function dijkstra(graph: PathGraph, startId: string, endId: string): DijkstraResult {
  if (startId === endId) return { path: [startId], distanceM: 0 };

  // Build adjacency list (bidirectional)
  const adj: Record<string, { to: string; dist: number }[]> = {};
  for (const node of graph.nodes) {
    adj[node.id] = [];
  }
  for (const edge of graph.edges) {
    if (!adj[edge.from]) adj[edge.from] = [];
    if (!adj[edge.to]) adj[edge.to] = [];
    adj[edge.from].push({ to: edge.to, dist: edge.distance_m });
    adj[edge.to].push({ to: edge.from, dist: edge.distance_m });
  }

  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited = new Set<string>();

  for (const node of graph.nodes) {
    dist[node.id] = Infinity;
    prev[node.id] = null;
  }
  dist[startId] = 0;

  // Simple priority queue using sorted array (fine for <100 nodes)
  const pq: { id: string; dist: number }[] = [{ id: startId, dist: 0 }];

  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const current = pq.shift()!;

    if (visited.has(current.id)) continue;
    visited.add(current.id);

    if (current.id === endId) break;

    for (const neighbor of (adj[current.id] || [])) {
      if (visited.has(neighbor.to)) continue;
      const newDist = dist[current.id] + neighbor.dist;
      if (newDist < (dist[neighbor.to] ?? Infinity)) {
        dist[neighbor.to] = newDist;
        prev[neighbor.to] = current.id;
        pq.push({ id: neighbor.to, dist: newDist });
      }
    }
  }

  // Reconstruct path
  if (dist[endId] === Infinity) {
    // No path found — fallback to straight-line estimate
    return { path: [startId, endId], distanceM: estimateStraightLine(graph, startId, endId) };
  }

  const path: string[] = [];
  let current: string | null = endId;
  while (current) {
    path.unshift(current);
    current = prev[current];
  }

  return { path, distanceM: dist[endId] };
}

function estimateStraightLine(graph: PathGraph, fromId: string, toId: string): number {
  const fromNode = graph.nodes.find(n => n.id === fromId);
  const toNode = graph.nodes.find(n => n.id === toId);
  if (!fromNode || !toNode) return 200; // default 200m

  const dLat = (toNode.lat - fromNode.lat) * 111000;
  const dLng = (toNode.lng - fromNode.lng) * 111000 * Math.cos(fromNode.lat * Math.PI / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng) * 1.3; // 30% penalty for non-straight paths
}

/**
 * Calculate walk time in minutes given distance and speed
 */
export function walkTimeMinutes(distanceM: number, speedKmh: number = 2.5): number {
  const speedMpm = (speedKmh * 1000) / 60; // meters per minute
  return Math.max(2, Math.round(distanceM / speedMpm));
}

/**
 * Collect utility nodes near the path (within maxDetourM)
 * These are non-blocking suggestions (restrooms, snacks, etc.)
 */
const UTILITY_TYPES = new Set(['restroom', 'snack', 'merch', 'photopass']);

export function collectPassingPoints(
  graph: PathGraph,
  path: string[],
  maxDetourM: number = 20,
  speedKmh: number = 2.5
): PassingPoint[] {
  const pathNodeIds = new Set(path);
  const points: PassingPoint[] = [];
  const seen = new Set<string>();

  // For each node on the path, find nearby utility nodes
  for (const pathNodeId of path) {
    const pathNode = graph.nodes.find(n => n.id === pathNodeId);
    if (!pathNode) continue;

    for (const node of graph.nodes) {
      if (pathNodeIds.has(node.id)) continue;
      if (seen.has(node.id)) continue;
      if (!UTILITY_TYPES.has(node.type)) continue;

      const dLat = (node.lat - pathNode.lat) * 111000;
      const dLng = (node.lng - pathNode.lng) * 111000 * Math.cos(pathNode.lat * Math.PI / 180);
      const distM = Math.sqrt(dLat * dLat + dLng * dLng);

      if (distM <= maxDetourM) {
        seen.add(node.id);
        const detourSeconds = Math.round((distM * 2) / ((speedKmh * 1000) / 3600)); // round trip
        points.push({
          type: node.type,
          label: node.label,
          nodeId: node.id,
          detourSeconds,
        });
      }
    }
  }

  return points;
}
