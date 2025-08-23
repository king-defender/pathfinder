import admin from 'firebase-admin';
import { AStarAlgorithm } from '../algorithms/AStar';
import { DijkstraAlgorithm } from '../algorithms/Dijkstra';
import { BFSAlgorithm } from '../algorithms/BFS';
import { createError } from '../middleware/errorHandler';

export interface Point {
  lat: number;
  lng: number;
}

export interface PathRequest {
  start: Point;
  end: Point;
  algorithm: 'astar' | 'dijkstra' | 'bfs';
  options?: Record<string, any>;
  userId: string;
}

export interface PathResult {
  id: string;
  path: Point[];
  distance: number;
  duration: number;
  algorithm: string;
  metadata?: Record<string, any>;
}

export interface PathHistory {
  paths: PathResult[];
  total: number;
}

export class PathfindingService {
  private astar = new AStarAlgorithm();
  private dijkstra = new DijkstraAlgorithm();
  private bfs = new BFSAlgorithm();

  async findPath(request: PathRequest): Promise<PathResult> {
    const { start, end, algorithm, options = {}, userId } = request;

    // Validate coordinates
    this.validateCoordinates(start);
    this.validateCoordinates(end);

    // Select algorithm
    let pathResult: { path: Point[]; distance: number; metadata?: Record<string, any> };
    const startTime = Date.now();

    switch (algorithm) {
      case 'astar':
        pathResult = await this.astar.findPath(start, end, options);
        break;
      case 'dijkstra':
        pathResult = await this.dijkstra.findPath(start, end, options);
        break;
      case 'bfs':
        pathResult = await this.bfs.findPath(start, end, options);
        break;
      default:
        throw createError(`Unsupported algorithm: ${algorithm}`, 400);
    }

    const duration = Date.now() - startTime;

    // Save to database
    const pathDoc = {
      userId,
      start,
      end,
      algorithm,
      path: pathResult.path,
      distance: pathResult.distance,
      duration,
      options,
      metadata: pathResult.metadata,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isPublic: options.isPublic || false
    };

    const docRef = await admin.firestore().collection('paths').add(pathDoc);

    // Log analytics
    await this.logAnalytics(userId, algorithm, duration, pathResult.distance);

    return {
      id: docRef.id,
      path: pathResult.path,
      distance: pathResult.distance,
      duration,
      algorithm,
      ...(pathResult.metadata && { metadata: pathResult.metadata })
    };
  }

  async batchFindPath(requests: Omit<PathRequest, 'userId'>[], userId: string): Promise<PathResult[]> {
    const results: PathResult[] = [];

    for (const request of requests) {
      try {
        const result = await this.findPath({ ...request, userId });
        results.push(result);
      } catch (error) {
        // Continue processing other requests even if one fails
        results.push({
          id: '',
          path: [],
          distance: 0,
          duration: 0,
          algorithm: request.algorithm,
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    }

    return results;
  }

  async getPathHistory(userId: string, page: number = 1, limit: number = 20): Promise<PathHistory> {
    const offset = (page - 1) * limit;

    const pathsQuery = admin.firestore()
      .collection('paths')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);

    const snapshot = await pathsQuery.get();
    
    // Get total count
    const countQuery = admin.firestore()
      .collection('paths')
      .where('userId', '==', userId);
    const countSnapshot = await countQuery.get();

    const paths: PathResult[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        path: data.path,
        distance: data.distance,
        duration: data.duration,
        algorithm: data.algorithm,
        metadata: data.metadata
      };
    });

    return {
      paths,
      total: countSnapshot.size
    };
  }

  async getPath(pathId: string, userId: string): Promise<PathResult | null> {
    const docRef = admin.firestore().collection('paths').doc(pathId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;

    // Check if user owns the path or if it's public
    if (data.userId !== userId && !data.isPublic) {
      throw createError('Access denied to this path', 403);
    }

    return {
      id: doc.id,
      path: data.path,
      distance: data.distance,
      duration: data.duration,
      algorithm: data.algorithm,
      metadata: data.metadata
    };
  }

  async deletePath(pathId: string, userId: string): Promise<void> {
    const docRef = admin.firestore().collection('paths').doc(pathId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw createError('Path not found', 404);
    }

    const data = doc.data()!;
    if (data.userId !== userId) {
      throw createError('Access denied to this path', 403);
    }

    await docRef.delete();
  }

  private validateCoordinates(point: Point): void {
    if (typeof point.lat !== 'number' || point.lat < -90 || point.lat > 90) {
      throw createError('Invalid latitude', 400);
    }
    if (typeof point.lng !== 'number' || point.lng < -180 || point.lng > 180) {
      throw createError('Invalid longitude', 400);
    }
  }

  private async logAnalytics(userId: string, algorithm: string, duration: number, distance: number): Promise<void> {
    try {
      const analyticsRef = admin.firestore()
        .collection('analytics')
        .doc(userId)
        .collection('events')
        .doc();

      await analyticsRef.set({
        type: 'pathfinding',
        algorithm,
        duration,
        distance,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      // Don't fail the main operation if analytics logging fails
      console.error('Failed to log analytics:', error);
    }
  }
}