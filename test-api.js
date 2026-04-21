// Test API endpoints
async function testAPI() {
  console.log('Testing PayToPermit API endpoints...\n');
  
  // Test health endpoint
  try {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    console.log('✅ Health check:', data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test fees endpoint
  try {
    const response = await fetch('http://localhost:3000/api/fees');
    const data = await response.json();
    console.log('✅ Fees endpoint:', data.success ? 'Working' : 'Failed');
  } catch (error) {
    console.log('❌ Fees endpoint failed:', error.message);
  }

  // Test auth login with sample data
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@paytopermit.com',
        password: 'admin123',
        role: 'admin'
      })
    });
    const data = await response.json();
    console.log('✅ Admin login:', data.success ? 'Working' : 'Failed');
  } catch (error) {
    console.log('❌ Admin login failed:', error.message);
  }

  // Test student login
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'john.doe@university.edu',
        password: 'student123',
        role: 'student'
      })
    });
    const data = await response.json();
    console.log('✅ Student login:', data.success ? 'Working' : 'Failed');
  } catch (error) {
    console.log('❌ Student login failed:', error.message);
  }

  console.log('\nAPI testing complete!');
}

testAPI();
