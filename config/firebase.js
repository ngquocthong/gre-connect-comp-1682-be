const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let firebaseApp = null;

const initializeFirebase = () => {
    if (firebaseApp) {
        return firebaseApp;
    }

    try {
        // Check if Firebase is already initialized
        if (admin.apps.length > 0) {
            firebaseApp = admin.apps[0];
            return firebaseApp;
        }

        // Initialize with service account from environment variable or file
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            // Option 1: Service account as JSON string in environment variable
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id
            });
        } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
            // Option 2: Path to service account file
            const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id
            });
        } else {
            console.warn('Firebase configuration not found. Push notifications will be disabled.');
            return null;
        }

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

