import { AStarAlgorithm } from '../../src/algorithms/AStar';
import { DijkstraAlgorithm } from '../../src/algorithms/Dijkstra';
import { BFSAlgorithm } from '../../src/algorithms/BFS';
import { Point } from '../../src/services/PathfindingService';

describe('Pathfinding Algorithms', () => {
  const start: Point = { lat: 40.7128, lng: -74.0060 }; // New York
  const end: Point = { lat: 40.7589, lng: -73.9851 }; // Times Square

  describe('A* Algorithm', () => {
    let astar: AStarAlgorithm;

    beforeEach(() => {
      astar = new AStarAlgorithm();
    });

    it('should find a path between two points', async () => {
      const result = await astar.findPath(start, end);

      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('distance');
      expect(result).toHaveProperty('metadata');
      expect(result.path).toHaveLength(11); // Default 10 steps + end
      expect(result.path[0]).toEqual(start);
      expect(result.path[result.path.length - 1]).toEqual(end);
      expect(result.distance).toBeGreaterThan(0);
      expect(result.metadata?.algorithm).toBe('A*');
    });

    it('should respect custom step count', async () => {
      const customSteps = 5;
      const result = await astar.findPath(start, end, { steps: customSteps });

      expect(result.path).toHaveLength(customSteps + 1);
    });
  });

  describe('Dijkstra Algorithm', () => {
    let dijkstra: DijkstraAlgorithm;

    beforeEach(() => {
      dijkstra = new DijkstraAlgorithm();
    });

    it('should find a path between two points', async () => {
      const result = await dijkstra.findPath(start, end);

      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('distance');
      expect(result).toHaveProperty('metadata');
      expect(result.path).toHaveLength(16); // Default 15 steps + end
      expect(result.path[0]).toEqual(start);
      expect(result.path[result.path.length - 1]).toEqual(end);
      expect(result.distance).toBeGreaterThan(0);
      expect(result.metadata?.algorithm).toBe('Dijkstra');
      expect(result.metadata?.guaranteed).toBe('optimal');
    });
  });

  describe('BFS Algorithm', () => {
    let bfs: BFSAlgorithm;

    beforeEach(() => {
      bfs = new BFSAlgorithm();
    });

    it('should find a path between two points', async () => {
      const result = await bfs.findPath(start, end);

      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('distance');
      expect(result).toHaveProperty('metadata');
      expect(result.path).toHaveLength(9); // Default 8 steps + end
      expect(result.path[0]).toEqual(start);
      expect(result.path[result.path.length - 1]).toEqual(end);
      expect(result.distance).toBeGreaterThan(0);
      expect(result.metadata?.algorithm).toBe('BFS');
      expect(result.metadata?.pathType).toBe('shortest_hops');
    });
  });

  describe('Algorithm Comparison', () => {
    it('should produce different results for different algorithms', async () => {
      const astar = new AStarAlgorithm();
      const dijkstra = new DijkstraAlgorithm();
      const bfs = new BFSAlgorithm();

      const astarResult = await astar.findPath(start, end);
      const dijkstraResult = await dijkstra.findPath(start, end);
      const bfsResult = await bfs.findPath(start, end);

      // Different algorithms should produce different path lengths
      expect(astarResult.path.length).not.toBe(dijkstraResult.path.length);
      expect(astarResult.path.length).not.toBe(bfsResult.path.length);
      expect(dijkstraResult.path.length).not.toBe(bfsResult.path.length);

      // All should have valid metadata
      expect(astarResult.metadata?.algorithm).toBe('A*');
      expect(dijkstraResult.metadata?.algorithm).toBe('Dijkstra');
      expect(bfsResult.metadata?.algorithm).toBe('BFS');
    });
  });
});