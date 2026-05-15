const e = require('electron');
console.log('Type:', typeof e);
console.log('Keys:', typeof e === 'object' ? Object.keys(e).slice(0, 10).join(', ') : e);
console.log('app:', e.app);
setTimeout(() => process.exit(0), 1000);
