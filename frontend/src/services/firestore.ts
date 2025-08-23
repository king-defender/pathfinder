import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Recommendation } from '../types';

export class FirestoreService {
  // Recommendations collection
  private recommendationsCollection = collection(db, 'recommendations');

  async getUserRecommendations(userId: string): Promise<Recommendation[]> {
    try {
      const q = query(
        this.recommendationsCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const recommendations: Recommendation[] = [];
      
      querySnapshot.forEach((doc) => {
        recommendations.push({
          id: doc.id,
          ...doc.data()
        } as Recommendation);
      });
      
      return recommendations;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  }

  async addRecommendation(recommendation: Omit<Recommendation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(this.recommendationsCollection, {
        ...recommendation,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding recommendation:', error);
      throw error;
    }
  }

  async updateRecommendation(id: string, updates: Partial<Recommendation>): Promise<void> {
    try {
      const docRef = doc(this.recommendationsCollection, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating recommendation:', error);
      throw error;
    }
  }

  async deleteRecommendation(id: string): Promise<void> {
    try {
      const docRef = doc(this.recommendationsCollection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      throw error;
    }
  }

  async generateAndSaveRecommendations(userId: string, _userProfile: any): Promise<Recommendation[]> {
    // This would integrate with the AI service to generate recommendations
    // For now, create some sample recommendations
    const sampleRecommendations = [
      {
        userId,
        title: 'Learn React Fundamentals',
        description: 'Start with React basics including components, state, and props',
        category: 'Frontend Development',
        priority: 1,
        status: 'pending' as const,
      },
      {
        userId,
        title: 'Master TypeScript',
        description: 'Learn TypeScript for better code quality and developer experience',
        category: 'Programming Languages',
        priority: 2,
        status: 'pending' as const,
      },
      {
        userId,
        title: 'Practice Data Structures',
        description: 'Strengthen your algorithmic thinking with data structures',
        category: 'Computer Science',
        priority: 3,
        status: 'pending' as const,
      }
    ];

    const createdRecommendations: Recommendation[] = [];
    
    for (const rec of sampleRecommendations) {
      const id = await this.addRecommendation(rec);
      createdRecommendations.push({
        id,
        ...rec,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }

    return createdRecommendations;
  }
}

export const firestoreService = new FirestoreService();