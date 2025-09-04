/**
 * Phase 1 Silent Tracking Test Script
 * Tests that tracking infrastructure is working correctly
 */

import { trackUserInteraction, trackSystemPerformance, trackDatabaseQuery, trackAIAnalysis } from './services/silentTracking';

async function testSilentTracking() {
  console.log('🔍 Testing Phase 1 Silent Tracking Infrastructure...\n');

  try {
    // Test 1: User interaction tracking
    console.log('✅ Testing user interaction tracking...');
    await trackUserInteraction({
      sessionToken: 'test-session-123',
      sectionId: 'site-info',
      interactionType: 'checklist_completion',
      timeSpent: 45,
      modificationsCount: 3,
      completionStatus: 'completed',
      contextData: {
        testMode: true,
        completionPercentage: 100
      }
    });
    console.log('   ✓ User interaction tracked successfully');

    // Test 2: System performance tracking
    console.log('✅ Testing system performance tracking...');
    await trackSystemPerformance({
      metricType: 'database_query',
      metricName: 'test_query',
      duration: 150,
      success: true,
      metadata: {
        testMode: true,
        queryType: 'SELECT'
      }
    });
    console.log('   ✓ System performance tracked successfully');

    // Test 3: Database query wrapper
    console.log('✅ Testing database query wrapper...');
    await trackDatabaseQuery(
      'test_wrapped_query',
      async () => {
        // Simulate a database query
        await new Promise(resolve => setTimeout(resolve, 100));
        return { testResult: 'success' };
      },
      { testMode: true }
    );
    console.log('   ✓ Database query wrapper working');

    // Test 4: AI analysis wrapper
    console.log('✅ Testing AI analysis wrapper...');
    await trackAIAnalysis(
      'test_ai_analysis',
      async () => {
        // Simulate AI analysis
        await new Promise(resolve => setTimeout(resolve, 200));
        return { analysis: 'test completed' };
      },
      { testMode: true }
    );
    console.log('   ✓ AI analysis wrapper working');

    console.log('\n🎉 All Phase 1 Silent Tracking tests passed!');
    console.log('📊 Data is being collected anonymously in the background');
    console.log('🔒 No user-facing changes - completely invisible to users');
    
  } catch (error) {
    console.error('❌ Silent tracking test failed:', error);
    throw error;
  }
}

// Run tests if called directly
if (require.main === module) {
  testSilentTracking()
    .then(() => {
      console.log('\n✅ Phase 1 Silent Tracking infrastructure is operational');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Phase 1 Silent Tracking test failed:', error);
      process.exit(1);
    });
}

export { testSilentTracking };