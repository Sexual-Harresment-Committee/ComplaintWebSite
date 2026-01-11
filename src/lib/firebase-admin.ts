
import "server-only";

// Helper to get Admin SDK instances
// We use 'require' dynamically inside the function to avoid top-level bundler issues
export async function getFirebaseAdmin() {
    const admin = require("firebase-admin");
    const { getFirestore } = require("firebase-admin/firestore");
    const { getAuth } = require("firebase-admin/auth");

    // Parse keys
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    // Check if already initialized
    // admin.apps is an array of initialized apps
    if (!admin.apps.length) {
        if (serviceAccountStr) {
            try {
                const serviceAccount = JSON.parse(serviceAccountStr);
                // Initialize ONLY if not present
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
                console.log("Firebase Admin Initialized (Scoped Mode).");
            } catch (error) {
                console.error("Scoped Admin Init Error:", error);
                throw error;
            }
        } else {
             throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY missing.");
        }
    }

    return {
        db: getFirestore(),
        auth: getAuth()
    };
}
