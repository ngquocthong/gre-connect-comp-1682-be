const admin = require('firebase-admin');
const path = require('path');

let firebaseApp = null;

const initializeFirebase = () => {
    if (firebaseApp) {
        return firebaseApp;
    }

    try {
        if (admin.apps.length > 0) {
            firebaseApp = admin.apps[0];
            return firebaseApp;
        }

        let serviceAccount = null;

        // Option 1: Base64 encoded service account (recommended for production)
        if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
            const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
            serviceAccount = JSON.parse(decoded);
        }
        // Option 2: JSON string in env var
        else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            // Fix newlines in private_key if needed
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
        }
        // Option 3: Path to service account file (relative to project root)
        else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
            const filePath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
            serviceAccount = require(filePath);
        }

        if (!serviceAccount) {
            console.warn('Firebase configuration not found. Push notifications will be disabled.');
            return null;
        }

        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });

        console.log('Firebase Admin SDK initialized successfully');
        return firebaseApp;
    } catch (error) {
        console.error('Error initializing Firebase:', error.message);
        return null;
    }
};

const getFirebaseAdmin = () => {
    if (!firebaseApp) {
        initializeFirebase();
    }
    return firebaseApp ? admin : null;
};

module.exports = {
    initializeFirebase,
    getFirebaseAdmin,
    admin
};

