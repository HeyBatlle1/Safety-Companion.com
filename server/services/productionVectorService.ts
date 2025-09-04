/**
 * Production Vector Embeddings Service
 * SAFE IMPLEMENTATION - Enhances existing system without breaking functionality
 */

import { db } from '../db';
import { vectorEmbeddingsService } from './vectorEmbeddings';
import { sql } from 'drizzle-orm';

interface SemanticSearchResult {
  regulation_id: string;
  title: string;
  description: string;
  similarity_score: number;
}

export class ProductionVectorService {
  /**
   * Safely search regulations using semantic similarity
   * Falls back to traditional search if embeddings fail
   */
  async searchRegulationsSemantic(
    query: string,
    options: {
      threshold?: number;
      maxResults?: number;
      fallbackToKeyword?: boolean;
    } = {}
  ): Promise<SemanticSearchResult[]> {
    const { threshold = 0.5, maxResults = 10, fallbackToKeyword = true } = options;
    
    try {
      // Generate embedding for search query
      const queryEmbedding = await vectorEmbeddingsService.generateEmbedding(query);
      
      // Track search performance
      const startTime = Date.now();
      
      // Execute semantic search using SQL function
      const results = await db.execute(sql`
        SELECT * FROM search_regulations_semantic(
          ${queryEmbedding}::vector,
          ${threshold},
          ${maxResults}
        )
      `);
      
      const searchTime = Date.now() - startTime;
      
      // Log search analytics
      await this.logSearchAnalytics(query, searchTime, results.length, results[0]?.similarity_score || 0);
      
      return results.map(row => ({
        regulation_id: row.regulation_id,
        title: row.title,
        description: row.description,
        similarity_score: row.similarity_score
      }));
      
    } catch (error) {
      console.error('Semantic search error:', error);
      
      // Fallback to keyword search if enabled
      if (fallbackToKeyword) {
        return await this.fallbackKeywordSearch(query, maxResults);
      }
      
      throw error;
    }
  }

  /**
   * Fallback keyword search (existing functionality)
   */
  private async fallbackKeywordSearch(query: string, maxResults: number): Promise<SemanticSearchResult[]> {
    const keywords = query.toLowerCase().split(' ');
    const searchPattern = keywords.map(k => `%${k}%`).join('|');
    
    const results = await db.execute(sql`
      SELECT 
        id as regulation_id,
        title,
        description,
        1.0 as similarity_score
      FROM osha_regulations
      WHERE LOWER(title || ' ' || description) SIMILAR TO ${searchPattern}
      LIMIT ${maxResults}
    `);
    
    return results.map(row => ({
      regulation_id: row.regulation_id,
      title: row.title,
      description: row.description,
      similarity_score: row.similarity_score
    }));
  }

  /**
   * Background embedding generation for new regulations
   */
  async generateEmbeddingsForRegulations(batchSize: number = 5): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    try {
      // Get regulations without embeddings
      const regulations = await db.execute(sql`
        SELECT id, title, description 
        FROM osha_regulations 
        WHERE embedding IS NULL 
        LIMIT ${batchSize}
      `);

      for (const reg of regulations) {
        processed++;
        const startTime = Date.now();
        
        try {
          // Generate embedding
          const embedding = await vectorEmbeddingsService.generateEmbedding(
            `${reg.title} ${reg.description}`
          );
          
          // Update regulation with embedding
          await db.execute(sql`
            UPDATE osha_regulations 
            SET embedding = ${embedding}::vector 
            WHERE id = ${reg.id}
          `);
          
          // Log success
          await db.execute(sql`
            INSERT INTO embedding_generation_log (
              regulation_id, 
              generation_time_ms, 
              success
            ) VALUES (
              ${reg.id},
              ${Date.now() - startTime},
              true
            )
          `);
          
          succeeded++;
          
          // Rate limiting to avoid API quota issues
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          failed++;
          
          // Log failure
          await db.execute(sql`
            INSERT INTO embedding_generation_log (
              regulation_id, 
              generation_time_ms, 
              success,
              error_message
            ) VALUES (
              ${reg.id},
              ${Date.now() - startTime},
              false,
              ${error instanceof Error ? error.message : 'Unknown error'}
            )
          `);
        }
      }
      
    } catch (error) {
      console.error('Batch embedding generation error:', error);
    }

    return { processed, succeeded, failed };
  }

  /**
   * Get embedding generation status
   */
  async getEmbeddingStatus(): Promise<{
    total_regulations: number;
    with_embeddings: number;
    pending_embeddings: number;
    completion_percentage: number;
  }> {
    const [totalCount] = await db.execute(sql`
      SELECT COUNT(*) as count FROM osha_regulations
    `);
    
    const [embeddedCount] = await db.execute(sql`
      SELECT COUNT(*) as count FROM osha_regulations WHERE embedding IS NOT NULL
    `);

    const total = totalCount.count;
    const embedded = embeddedCount.count;
    const pending = total - embedded;
    const percentage = total > 0 ? Math.round((embedded / total) * 100) : 0;

    return {
      total_regulations: total,
      with_embeddings: embedded,
      pending_embeddings: pending,
      completion_percentage: percentage
    };
  }

  /**
   * Log search analytics for improvement
   */
  private async logSearchAnalytics(
    query: string, 
    searchTime: number, 
    resultsCount: number, 
    topScore: number
  ): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO semantic_search_analytics (
          query_text,
          search_time_ms,
          results_count,
          top_similarity_score
        ) VALUES (
          ${query},
          ${searchTime},
          ${resultsCount},
          ${topScore}
        )
      `);
    } catch (error) {
      // Silent failure - analytics shouldn't break searches
      console.debug('Search analytics logging failed:', error);
    }
  }
}

export const productionVectorService = new ProductionVectorService();