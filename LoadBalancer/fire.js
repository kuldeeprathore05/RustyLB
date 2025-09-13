const axios = require('axios');

// Configuration
const URL = 'https://rustylb-vz2m.onrender.com';  // Change to 8000 if needed
const TOTAL_REQUESTS = 1000;           // Total number of requests
const CONCURRENT_REQUESTS = 50;       // How many at the same time

async function sendRequest(requestId) {
  try {
    const startTime = Date.now();
    const response = await axios.get(URL);
    const endTime = Date.now();
    
    console.log(`✅ Request ${requestId}: Success (${endTime - startTime}ms)`, response.data);
    return { success: true, time: endTime - startTime };
  } catch (error) {
    console.log(`❌ Request ${requestId}: Failed -`, error.message);
    return { success: false, error: error.message };
  }
}

async function runLoadTest() {
  console.log(`🚀 Starting load test...`);
  console.log(`📊 Target: ${URL}`);
  console.log(`📈 Total requests: ${TOTAL_REQUESTS}`);
  console.log(`⚡ Concurrent requests: ${CONCURRENT_REQUESTS}`);
  console.log('─'.repeat(50));

  const startTime = Date.now();
  const results = [];

  // Send requests in batches
  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENT_REQUESTS) {
    const batch = [];
    
    // Create a batch of concurrent requests
    for (let j = 0; j < CONCURRENT_REQUESTS && (i + j) < TOTAL_REQUESTS; j++) {
      const requestId = i + j + 1;
      batch.push(sendRequest(requestId));
    }
    
    // Wait for this batch to complete
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
    
    console.log(`📦 Batch ${Math.floor(i/CONCURRENT_REQUESTS) + 1} completed`);
  }

  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  // Calculate statistics
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgTime = results
    .filter(r => r.success && r.time)
    .reduce((sum, r) => sum + r.time, 0) / successful || 0;

  console.log('─'.repeat(50));
  console.log('📊 LOAD TEST RESULTS:');
  console.log(`⏱️  Total time: ${totalTime}ms`);
  console.log(`✅ Successful requests: ${successful}`);
  console.log(`❌ Failed requests: ${failed}`);
  console.log(`📈 Success rate: ${(successful/TOTAL_REQUESTS*100).toFixed(1)}%`);
  console.log(`⚡ Average response time: ${avgTime.toFixed(1)}ms`);
  console.log(`🔥 Requests per second: ${(TOTAL_REQUESTS/(totalTime/1000)).toFixed(1)}`);
}

// Run the test
runLoadTest().catch(console.error);