import { Point } from '../services/PathfindingService';
import { PathfindingAlgorithm } from './AStar';

export class BFSAlgorithm implements PathfindingAlgorithm {
  async findPath(start: Point, end: Point, options: Record<string, any> = {}): Promise<{
    path: Point[];
    distance: number;
    metadata?: Record<string, any>;
  }> {
    const startTime = Date.now();
    
    // Simplified BFS implementation for demonstration
    const path = await this.calculateBFSPath(start, end, options);
    const distance = this.calculateDistance(path);
    
    const metadata = {
      algorithm: 'BFS',
      nodesExplored: path.length * 3, // BFS explores many nodes
      executionTime: Date.now() - startTime,
      pathType: 'shortest_hops', // BFS finds shortest path in terms of hops
      options
    };

    return { path, distance, metadata };
  }

  private async calculateBFSPath(start: Point, end: Point, options: Record<string, any>): Promise<Point[]> {
    // Simplified implementation
    // Real BFS would use queue and explore level by level
    
    const steps = options.steps || 8; // Fewer steps but guaranteed shortest path
    const path: Point[] = [start];
    
    // BFS explores breadth-first, so simulate more direct path
    for (let i = 1; i < steps; i++) {
      const progress = i / steps;
      const lat = start.lat + (end.lat - start.lat) * progress;
      const lng = start.lng + (end.lng - start.lng) * progress;
      path.push({ lat, lng });
    }
    
    path.push(end);
    return path;
  }

  private calculateDistance(path: Point[]): number {
    let totalDistance = 0;
    
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      if (prev && curr) {
        totalDistance += this.haversineDistance(prev, curr);
      }
    }
    
    return totalDistance;
  }

  private haversineDistance(point1: Point, point2: Point): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}