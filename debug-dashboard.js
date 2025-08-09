// Script di debug per la dashboard
// Copia e incolla questo codice nella console del browser

console.log('🔍 DEBUG DASHBOARD - Inizio analisi...\n');

// Funzione per testare gli endpoint
async function testEndpoints() {
  const token = localStorage.getItem('token');
  const organizationId = localStorage.getItem('organizationId') || '5d260bdd-d1e6-4004-8a81-711605f48aa3';
  
  console.log('📝 Token:', token ? 'Presente' : 'Mancante');
  console.log('🏢 Organization ID:', organizationId);
  console.log('\n');
  
  const endpoints = [
    '/api/v1/athletes',
    '/api/v1/documents/expiring?days=30',
    '/api/v1/payments/overdue',
    '/api/v1/matches/upcoming?limit=5'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`📡 Testing: ${endpoint}`);
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Organization-ID': organizationId,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Success: ${data.success}`);
      
      if (data.success) {
        console.log('   Data structure:', Object.keys(data.data || data));
        
        // Analizza la struttura dei dati
        if (data.data) {
          if (data.data.athletes) {
            console.log(`   ✅ Athletes found: ${data.data.athletes.length}`);
          } else if (Array.isArray(data.data)) {
            console.log(`   ✅ Array data: ${data.data.length} items`);
          } else if (data.data.payments) {
            console.log(`   ✅ Payments found: ${data.data.payments.length}`);
          } else {
            console.log('   ⚠️ Unknown structure:', data.data);
          }
        }
      } else {
        console.log('   ❌ Error:', data.error);
      }
    } catch (error) {
      console.log(`   ❌ Fetch error:`, error.message);
    }
    console.log('');
  }
}

// Esegui il test
testEndpoints();
