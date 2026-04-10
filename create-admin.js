const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = require('./service-account-key.json');

initializeApp({
  credential: cert(serviceAccount)
});

async function createAdminUser() {
  const email = 'admin@gbarber.com';
  const password = 'Admin123!';
  
  try {
    const user = await getAuth().createUser({
      email,
      password,
      displayName: 'Administrador'
    });
    console.log('Admin criado com sucesso!');
    console.log('Email:', email);
    console.log('Senha:', password);
    console.log('UID:', user.uid);
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('Admin já existe!');
      const user = await getAuth().getUserByEmail(email);
      console.log('UID:', user.uid);
    } else {
      console.error('Erro:', error.message);
    }
  }
}

createAdminUser();