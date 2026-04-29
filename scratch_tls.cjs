const tls = require('tls');
const net = require('net');
const forge = require('node-forge');

function generateCertificate() {
    var keys = forge.pki.rsa.generateKeyPair(2048);
    var cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
    var attrs = [{
        name: 'commonName',
        value: 'example.org'
    }, {
        name: 'countryName',
        value: 'US'
    }, {
        shortName: 'ST',
        value: 'Virginia'
    }, {
        name: 'localityName',
        value: 'Blacksburg'
    }, {
        name: 'organizationName',
        value: 'Test'
    }, {
        shortName: 'OU',
        value: 'Test'
    }];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey);

    return {
        key: forge.pki.privateKeyToPem(keys.privateKey),
        cert: forge.pki.certificateToPem(cert)
    };
}

const certs = generateCertificate();

const options = {
  key: certs.key,
  cert: certs.cert,
  requestCert: true,
  rejectUnauthorized: false
};

const server = tls.createServer(options, (socket) => {
  console.log("SERVER got cert exponent:", socket.getPeerCertificate()?.exponent);
  socket.end();
  server.close();
});

server.listen(8000, () => {
  const client = tls.connect(8000, 'localhost', options, () => {
    console.log("CLIENT got cert exponent:", client.getCertificate()?.exponent);
  });
});
