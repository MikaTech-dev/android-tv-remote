const crypto = require('crypto');
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

console.log(publicKey.export({ type: 'spki', format: 'jwk' }).e);
