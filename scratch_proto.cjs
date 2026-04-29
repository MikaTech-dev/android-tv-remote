const protobuf = require('protobufjs');
const path = require('path');

const root = protobuf.loadSync(path.join(__dirname, 'node_modules/androidtv-remote/dist/pairing/pairingmessage.proto'));
const PairingMessage = root.lookupType("pairing.PairingMessage");

function hexStringToBytes(q) {
    var bytes = [];
    for (var i = 0; i < q.length; i += 2) {
      var byte = parseInt(q.substring(i, i + 2), 16);
      if (byte > 127) {
        byte = -(~byte & 0xFF) - 1;
      }
      bytes.push(byte);
    }
    return bytes;
}

const hashStr = 'ed1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd';
const hashArray = hexStringToBytes(hashStr);

const message = PairingMessage.create({
    pairingSecret: {
        secret: hashArray
    },
    status: 200,
    protocolVersion: 2
});

const encoded = PairingMessage.encodeDelimited(message).finish();
console.log("Encoded with signed array:", encoded);

// Now try with Uint8Array
const uint8Array = new Uint8Array(hashArray);
const message2 = PairingMessage.create({
    pairingSecret: {
        secret: uint8Array
    },
    status: 200,
    protocolVersion: 2
});
const encoded2 = PairingMessage.encodeDelimited(message2).finish();
console.log("Encoded with Uint8Array:", encoded2);
console.log("Are they equal?", Buffer.from(encoded).equals(Buffer.from(encoded2)));
