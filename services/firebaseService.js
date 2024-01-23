const admin = require('firebase-admin');
const path = require('path');

admin.initializeApp({
    credential: admin.credential.cert(path.join(__dirname, 'serviceAccountKey.json')), // take something from serviceAccountKey.json
    storageBucket: 'neshtech-1b9aa.appspot.com',
});
const bucket = admin.storage().bucket();
module.exports = {
    bucket,
}