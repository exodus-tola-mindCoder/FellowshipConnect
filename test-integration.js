// Simple test script to verify frontend-backend integration
import { get } from 'axios';

async function testIntegration() {
  console.log('🧪 Testing Frontend-Backend Integration...\n');
  
  try {
    // Test 1: Health check endpoint
    console.log('1. Testing health check endpoint...');
    const healthResponse = await get('http://localhost:5001/api/health');
    console.log('✅ Health check:', healthResponse.data.status);
    
    // Test 2: Test login endpoint structure
    console.log('\n2. Testing API endpoints are accessible...');
    const authResponse = await get('http://localhost:5001/api/auth/health');
    console.log('✅ Auth endpoint accessible');
    
    console.log('\n🎉 Integration test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   - Start backend: npm run server (from server directory)');
    console.log('   - Start frontend: npm run dev (from root directory)');
    console.log('   - Visit http://localhost:5173 to test the application');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Make sure backend is running on port 5001');
    console.log('   - Check if MongoDB is running');
    console.log('   - Verify .env file has correct configuration');
  }
}

// Run the test
testIntegration();
