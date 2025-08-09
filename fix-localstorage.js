// Esegui questo nella console del browser per sistemare tutto

// 1. Pulisci tutto
localStorage.clear();
console.log('✅ LocalStorage pulito');

// 2. Recupera i dati dell'utente dal localStorage esistente
const userStr = localStorage.getItem('user');
if (userStr) {
    const user = JSON.parse(userStr);
    console.log('👤 Utente trovato:', user.email);
    
    // 3. Imposta tutti i valori necessari
    const token = localStorage.getItem('token');
    if (token) {
        localStorage.setItem('token', token);
        console.log('✅ Token salvato');
    }
    
    // 4. Imposta l'organizationId dalla struttura dell'utente
    const orgId = user.organizationId || '5d260bdd-d1e6-4004-8a81-711605f48aa3';
    localStorage.setItem('organizationId', orgId);
    console.log('✅ OrganizationId salvato:', orgId);
    
    // 5. Risalva l'utente
    localStorage.setItem('user', userStr);
    console.log('✅ User salvato');
    
    console.log('\n🎯 ORA RICARICA LA PAGINA (F5) E DOVRESTI VEDERE GLI ATLETI!');
} else {
    console.log('❌ Nessun utente trovato nel localStorage');
    console.log('📝 Salvando manualmente i dati...');
    
    // Imposta manualmente l'organizationId
    localStorage.setItem('organizationId', '5d260bdd-d1e6-4004-8a81-711605f48aa3');
    console.log('✅ OrganizationId salvato manualmente');
    console.log('\n🎯 RICARICA LA PAGINA (F5)');
}

// 6. Verifica finale
console.log('\n📊 Verifica finale:');
console.log('Token:', localStorage.getItem('token') ? '✅ Presente' : '❌ Mancante');
console.log('OrganizationId:', localStorage.getItem('organizationId') || '❌ Mancante');
console.log('User:', localStorage.getItem('user') ? '✅ Presente' : '❌ Mancante');
