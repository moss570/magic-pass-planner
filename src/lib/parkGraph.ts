/**
 * Client-side park path graph helper.
 * Loads the graph from Supabase park_paths table and runs Dijkstra locally.
 */

import { supabase } from "@/integrations/supabase/client";

export interface PathNode {
  id: string;
  label: string;
  type: string;
  lat: number;
  lng: number;
  land?: string;
}

export interface PathEdge {
  from: string;
  to: string;
  distance_m: number;
  shortcut?: boolean;
  throughBuilding?: string;
}

export interface PathGraph {
  nodes: PathNode[];
  edges: PathEdge[];
}

export interface RouteStep {
  fromNodeId: string;
  toNodeId: string;
  fromLabel: string;
  toLabel: string;
  distanceM: number;
  shortcut: boolean;
  throughBuilding?: string;
  /** Bearing from → to in degrees (0=N, clockwise) */
  bearing: number;
}

export interface RouteResult {
  steps: RouteStep[];
  totalDistanceM: number;
  path: string[];
}

// In-memory cache per park
const graphCache: Record<string, PathGraph> = {};

/** Load and cache the path graph for a park */
export async function loadParkGraph(parkId: string): Promise<PathGraph> {
  if (graphCache[parkId]) return graphCache[parkId];

  const { data, error } = await supabase
    .from("park_paths")
    .select("nodes, edges")
    .eq("park_id", parkId)
    .single();

  if (error || !data) {
    console.warn("Failed to load park graph for", parkId, error);
    return { nodes: [], edges: [] };
  }

  const graph: PathGraph = {
    nodes: (data.nodes as any[]) || [],
    edges: (data.edges as any[]) || [],
  };
  graphCache[parkId] = graph;
  return graph;
}

/** Find the nearest graph node to a GPS position */
export function findNearestNode(graph: PathGraph, lat: number, lng: number): PathNode | null {
  if (!graph.nodes.length) return null;
  let best: PathNode | null = null;
  let bestDist = Infinity;

  for (const node of graph.nodes) {
    const d = haversineM(lat, lng, node.lat, node.lng);
    if (d < bestDist) {
      bestDist = d;
      best = node;
    }
  }
  return best;
}

/** Dijkstra shortest path — mirrors supabase/functions/_shared/dijkstra.ts */
export function dijkstra(graph: PathGraph, startId: string, endId: string): RouteResult {
  if (startId === endId) return { steps: [], totalDistanceM: 0, path: [startId] };

  // Build adjacency
  const adj: Record<string, { to: string; dist: number; edgeIdx: number }[]> = {};
  for (const node of graph.nodes) adj[node.id] = [];
  graph.edges.forEach((edge, idx) => {
    if (!adj[edge.from]) adj[edge.from] = [];
    if (!adj[edge.to]) adj[edge.to] = [];
    adj[edge.from].push({ to: edge.to, dist: edge.distance_m, edgeIdx: idx });
    adj[edge.to].push({ to: edge.from, dist: edge.distance_m, edgeIdx: idx });
  });

  const dist: Record<string, number> = {};
  const prev: Record<string, { nodeId: string; edgeIdx: number } | null> = {};
  const visited = new Set<string>();

  for (const node of graph.nodes) {
    dist[node.id] = Infinity;
    prev[node.id] = null;
  }
  dist[startId] = 0;

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
        prev[neighbor.to] = { nodeId: current.id, edgeIdx: neighbor.edgeIdx };
        pq.push({ id: neighbor.to, dist: newDist });
      }
    }
  }

  // Reconstruct
  if (dist[endId] === Infinity) {
    return { steps: [], totalDistanceM: estimateStraightLine(graph, startId, endId), path: [startId, endId] };
  }

  const pathIds: string[] = [];
  let cur: string | null = endId;
  const edgeIndices: number[] = [];
  while (cur) {
    pathIds.unshift(cur);
    const p = prev[cur];
    if (p) {
      edgeIndices.unshift(p.edgeIdx);
      cur = p.nodeId;
    } else {
      cur = null;
    }
  }

  // Build steps
  const steps: RouteStep[] = [];
  for (let i = 0; i < pathIds.length - 1; i++) {
    const fromNode = graph.nodes.find(n => n.id === pathIds[i])!;
    const toNode = graph.nodes.find(n => n.id === pathIds[i + 1])!;
    const edge = graph.edges[edgeIndices[i]];
    steps.push({
      fromNodeId: fromNode.id,
      toNodeId: toNode.id,
      fromLabel: fromNode.label,
      toLabel: toNode.label,
      distanceM: edge.distance_m,
      shortcut: !!edge.shortcut,
      throughBuilding: edge.throughBuilding,
      bearing: computeBearing(fromNode.lat, fromNode.lng, toNode.lat, toNode.lng),
    });
  }

  return { steps, totalDistanceM: dist[endId], path: pathIds };
}

function estimateStraightLine(graph: PathGraph, fromId: string, toId: string): number {
  const fromNode = graph.nodes.find(n => n.id === fromId);
  const toNode = graph.nodes.find(n => n.id === toId);
  if (!fromNode || !toNode) return 200;
  return haversineM(fromNode.lat, fromNode.lng, toNode.lat, toNode.lng) * 1.3;
}

/** Haversine distance in meters */
export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Bearing from point A to B in degrees (0=N, clockwise) */
export function computeBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

/** Distance from a point to a line segment (for off-route detection) */
export function pointToSegmentDistance(
  pLat: number, pLng: number,
  aLat: number, aLng: number,
  bLat: number, bLng: number
): number {
  // Project in meters
  const cosLat = Math.cos(pLat * Math.PI / 180);
  const px = (pLng - aLng) * 111000 * cosLat;
  const py = (pLat - aLat) * 111000;
  const bx = (bLng - aLng) * 111000 * cosLat;
  const by = (bLat - aLat) * 111000;
  const lenSq = bx * bx + by * by;
  if (lenSq === 0) return Math.sqrt(px * px + py * py);
  let t = (px * bx + py * by) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const dx = px - t * bx;
  const dy = py - t * by;
  return Math.sqrt(dx * dx + dy * dy);
}
