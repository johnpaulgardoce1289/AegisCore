fetch('http://localhost:3000/api/auth/providers').then(r => r.text()).then(t => require('fs').writeFileSync('error_500.html', t))
