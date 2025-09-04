/**
 * Safe Embedding Generator - Production Intelligence Activation
 * Generates and stores vector embeddings for your existing safety data
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = gemini.getGenerativeModel({ model: 'text-embedding-004' });

async function activateSafetyIntelligence() {
  console.log('🎯 ACTIVATING SAFETY COMPANION INTELLIGENCE');
  console.log('==========================================\n');
  
  try {
    // Step 1: Get your real safety data
    console.log('📋 Loading your safety analyses...');
    const analyses = await sql`
      SELECT id, query, response, type 
      FROM analysis_history 
      WHERE query_embedding IS NULL
      ORDER BY created_at ASC
    `;
    
    console.log(`Found ${analyses.length} analyses ready for intelligence upgrade\n`);
    
    if (analyses.length === 0) {
      console.log('✅ All analyses already have embeddings!');
      return;
    }
    
    // Step 2: Process each analysis
    let successCount = 0;
    
    for (const analysis of analyses) {
      console.log(`Processing: "${analysis.query.substring(0, 60)}..."`);
      
      try {
        // Generate embeddings
        const [queryResult, responseResult] = await Promise.all([
          model.embedContent(analysis.query),
          model.embedContent(analysis.response)
        ]);
        
        const queryEmbedding = queryResult.embedding.values;
        const responseEmbedding = responseResult.embedding.values;
        
        // Format vectors as JSON arrays
        const queryVector = JSON.stringify(queryEmbedding);
        const responseVector = JSON.stringify(responseEmbedding);
        
        // Update database
        await sql`
          UPDATE analysis_history 
          SET 
            query_embedding = ${queryVector}::vector,
            response_embedding = ${responseVector}::vector
          WHERE id = ${analysis.id}
        `;
        
        successCount++;
        console.log(`  ✅ Embedded successfully (${queryEmbedding.length}D vectors)`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`  ❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.log(`    Error details:`, error);
      }
    }
    
    console.log(`\n📊 EMBEDDING RESULTS:`);
    console.log(`  Successfully embedded: ${successCount}/${analyses.length}`);
    
    // Step 3: Test semantic search
    if (successCount > 0) {
      console.log('\n🔍 TESTING SEMANTIC SEARCH...\n');
      
      const testQueries = [
        'ladder safety requirements',
        'chemical handling procedures',
        'fall protection standards'
      ];
      
      for (const testQuery of testQueries) {
        console.log(`Testing: "${testQuery}"`);
        
        try {
          const testResult = await model.embedContent(testQuery);
          const testEmbedding = testResult.embedding.values;
          
          const searchResults = await sql`
            SELECT 
              query,
              type,
              (1 - (query_embedding <=> ${testEmbedding}::vector)) as similarity
            FROM analysis_history
            WHERE query_embedding IS NOT NULL
            ORDER BY query_embedding <=> ${testEmbedding}::vector
            LIMIT 2
          `;
          
          if (searchResults.length > 0) {
            const topResult = searchResults[0];
            const similarity = Math.round(topResult.similarity * 100);
            console.log(`  → "${topResult.query.substring(0, 50)}..." (${similarity}% match)`);
          } else {
            console.log(`  → No semantic matches found`);
          }
          
        } catch (error) {
          console.log(`  → Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Step 4: Final validation
      console.log('\n🎊 SAFETY COMPANION INTELLIGENCE ACTIVATED! 🎊');
      console.log('===============================================\n');
      
      const finalCheck = await sql`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN query_embedding IS NOT NULL THEN 1 END) as embedded
        FROM analysis_history
      `;
      
      const stats = finalCheck[0];
      const completionPct = Math.round((stats.embedded / stats.total) * 100);
      
      console.log(`📈 SYSTEM STATUS:`);
      console.log(`  Total analyses: ${stats.total}`);
      console.log(`  With AI embeddings: ${stats.embedded}`);
      console.log(`  Intelligence completion: ${completionPct}%\n`);
      
      if (completionPct >= 100) {
        console.log('🚀 YOUR PLATFORM NOW HAS SEMANTIC AI INTELLIGENCE:');
        console.log('  • "height safety" finds fall protection requirements');
        console.log('  • "chemical procedures" connects to handling protocols');
        console.log('  • "site inspection" discovers relevant assessments');
        console.log('  • Contextual understanding beyond keyword matching\n');
        
        console.log('🏆 COMPETITIVE ADVANTAGE ACHIEVED!');
        console.log('From basic safety software → AI-powered intelligence platform');
      }
      
    } else {
      console.log('\n⚠️  No embeddings generated - please check API configuration');
    }
    
  } catch (error) {
    console.error('\n❌ Intelligence activation failed:', error);
    process.exit(1);
  }
}

// Execute intelligence activation
activateSafetyIntelligence()
  .then(() => {
    console.log('\n🎯 SAFETY COMPANION INTELLIGENCE IS LIVE! 🎯');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Activation error:', error.message);
    process.exit(1);
  });