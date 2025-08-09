#!/usr/bin/env node

/**
 * Fix Storage Issues Script
 * Risolve i problemi di disallineamento tra localStorage e sessionStorage
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing storage issues in the project...\n');

// Directory da scansionare
const srcDir = path.join(__dirname, 'src');

// Funzione per sostituire localStorage con sessionStorage in modo intelligente
function fixStorageInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pattern da sostituire
  const patterns = [
    {
      // localStorage.getItem
      from: /localStorage\.getItem\(/g,
      to: 'sessionStorage.getItem(',
      description: 'localStorage.getItem'
    },
    {
      // localStorage.setItem
      from: /localStorage\.setItem\(/g,
      to: 'sessionStorage.setItem(',
      description: 'localStorage.setItem'
    },
    {
      // localStorage.removeItem
      from: /localStorage\.removeItem\(/g,
      to: 'sessionStorage.removeItem(',
      description: 'localStorage.removeItem'
    },
    {
      // localStorage.clear
      from: /localStorage\.clear\(/g,
      to: 'sessionStorage.clear(',
      description: 'localStorage.clear'
    }
  ];
  
  patterns.forEach(pattern => {
    if (content.match(pattern.from)) {
      const matches = content.match(pattern.from);
      if (matches) {
        console.log(`  📝 Found ${matches.length} occurrences of ${pattern.description}`);
        content = content.replace(pattern.from, pattern.to);
        modified = true;
      }
    }
  });
  
  // Caso speciale: solo localStorage (senza metodo)
  const standalonePattern = /(?<!session)localStorage(?!\.)/g;
  if (content.match(standalonePattern)) {
    const matches = content.match(standalonePattern);
    if (matches) {
      console.log(`  📝 Found ${matches.length} occurrences of standalone localStorage`);
      content = content.replace(standalonePattern, 'sessionStorage');
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Funzione ricorsiva per scansionare directory
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  let totalFixed = 0;
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Salta node_modules e .git
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build') {
        totalFixed += scanDirectory(filePath);
      }
    } else if (stat.isFile()) {
      // Processa solo file JS/JSX/TS/TSX
      if (/\.(jsx?|tsx?)$/.test(file)) {
        // Salta authService.js che è già corretto
        if (!file.includes('authService')) {
          console.log(`\nChecking: ${filePath.replace(__dirname, '.')}`);
          
          if (fixStorageInFile(filePath)) {
            console.log(`  ✅ Fixed storage issues`);
            totalFixed++;
          } else {
            console.log(`  ⏭️  No localStorage usage found`);
          }
        }
      }
    }
  });
  
  return totalFixed;
}

// Esegui la scansione
console.log('Starting scan...\n');
const fixedFiles = scanDirectory(srcDir);

console.log('\n' + '='.repeat(50));
console.log(`✨ Scan complete!`);
console.log(`📊 Total files fixed: ${fixedFiles}`);

if (fixedFiles > 0) {
  console.log('\n⚠️  Important: The app now uses sessionStorage instead of localStorage');
  console.log('   This means users will need to login again when they close the browser.');
  console.log('   This is more secure but less persistent than localStorage.');
}

console.log('='.repeat(50));
