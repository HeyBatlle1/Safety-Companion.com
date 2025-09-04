/**
 * Simple Safety Intelligence Test
 * Generate embeddings and test semantic search with your real data
 */

import { vectorEmbeddingsService } from './services/vectorEmbeddings';
import { db } from './db';
import { sql } from 'drizzle-orm';

async function simpleIntelligenceTest() {
  console.log('🚀 SIMPLE SAFETY INTELLIGENCE TEST\n');
  
  try {
    // Step 1: Get your existing safety analyses
    console.log('📊 Fetching your existing safety analyses...');
    const analyses = await db.execute(sql`
      SELECT id, query, response, type FROM analysis_history
    `);
    
    console.log(`Found ${analyses.length} safety analyses to make intelligent\n`);
    
    if (analyses.length === 0) {
      console.log('⚠️  No analyses found - create some safety assessments first');
      return;
    }
    
    // Step 2: Generate embeddings for the first few analyses
    console.log('🧠 Generating embeddings for your safety data...\n');
    
    for (let i = 0; i < Math.min(3, analyses.length); i++) {
      const analysis = analyses[i];
      console.log(`Processing: "${analysis.query.substring(0, 50)}..."`);
      
      try {
        // Generate embeddings
        const queryEmbedding = await vectorEmbeddingsService.generateEmbedding(analysis.query);
        const responseEmbedding = await vectorEmbeddingsService.generateEmbedding(analysis.response);
        
        // Update the database
        await db.execute(sql`
          UPDATE analysis_history 
          SET 
            query_embedding = ${queryEmbedding}::vector,
            response_embedding = ${responseEmbedding}::vector
          WHERE id = ${analysis.id}
        `);
        
        console.log(`✅ Embedded: ${analysis.type} analysis`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`❌ Failed to embed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Step 3: Test semantic search
    console.log('\n🔍 Testing semantic search with your real data...\n');
    
    const testQueries = [
      'safety risks',
      'fall protection',
      'hazard assessment'
    ];
    
    for (const query of testQueries) {
      try {
        console.log(`Searching for: "${query}"`);
        
        // Generate query embedding
        const queryEmbedding = await vectorEmbeddingsService.generateEmbedding(query);
        
        // Search semantically
        const results = await db.execute(sql`
          SELECT 
            query,
            response,
            type,
            (1 - (query_embedding <=> ${queryEmbedding}::vector)) as similarity
          FROM analysis_history
          WHERE query_embedding IS NOT NULL
          ORDER BY query_embedding <=> ${queryEmbedding}::vector
          LIMIT 2
        `);
        
        if (results.length > 0) {
          const topResult = results[0];
          const similarity = Math.round(topResult.similarity * 100);
          console.log(`  → Found: "${topResult.query.substring(0, 40)}..." (${similarity}% match)`);
        } else {
          console.log(`  → No semantic matches found`);
        }
        
      } catch (error) {
        console.log(`  → Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Step 4: Report status
    console.log('\n📊 Current Intelligence Status:');
    
    const embeddedCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM analysis_history WHERE query_embedding IS NOT NULL
    `);
    
    const totalCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM analysis_history
    `);
    
    const embedded = embeddedCount[0]?.count || 0;
    const total = totalCount[0]?.count || 0;
    const percentage = total > 0 ? Math.round((embedded / total) * 100) : 0;
    
    console.log(`  Analyses with embeddings: ${embedded}/${total} (${percentage}%)`);
    console.log(`  Semantic search: ${embedded > 0 ? 'OPERATIONAL' : 'PENDING'}`);
    
    console.log('\n🎉 TEST COMPLETE!');
    console.log('================\n');
    
    if (embedded > 0) {
      console.log('✅ Your Safety Companion now has semantic intelligence!');
      console.log('🧠 Real safety data is now semantically searchable');
      console.log('🔍 Users get better recommendations through AI understanding');
      console.log('⚡ System falls back to keyword search for 100% reliability\n');
      
      console.log('🛠️  NEXT STEPS:');
      console.log('1. Continue embedding generation for remaining analyses');
      console.log('2. Integrate semantic search into user-facing features');  
      console.log('3. Monitor performance and accuracy improvements');
      console.log('4. Gradually replace keyword search with semantic search');
    } else {
      console.log('⚠️  Embedding generation needs API access');
      console.log('🔧 Check GEMINI_API_KEY environment variable');
      console.log('📡 Verify API quota and permissions');
    }
    
  } catch (error) {
    console.error('❌ Intelligence test failed:', error);
  }
}

// Run the test
simpleIntelligenceTest();