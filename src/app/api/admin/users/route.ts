
import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const { db } = await getFirebaseAdmin();
    // 1. Fetch from Firestore 'users' collection
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { auth, db } = await getFirebaseAdmin();
    const body = await request.json();
    console.log("Request body parsed. Processing...");
    
    const { email, password, role, name, department } = body;

    let uid;
    
    try {
        // 1. Create Auth User
        const userRecord = await auth.createUser({
          email,
          password,
          displayName: name,
        });
        uid = userRecord.uid;
    } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
             console.log("User exists in Auth. Fetching UID to sync Firestore...");
             const existingUser = await auth.getUserByEmail(email);
             uid = existingUser.uid;
        } else {
            throw authError; // Rethrow other errors
        }
    }

    // 2. Set Custom Claims
    await auth.setCustomUserClaims(uid, { role });

    // 3. Create/Overwrite Firestore User Document
    await db.collection('users').doc(uid).set({
      uid,
      email,
      name,
      role,
      department,
      createdAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ success: true, uid });
  } catch (error: any) {
    console.error("Create User Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    try {
        const { auth, db } = await getFirebaseAdmin();
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');

        if (!uid) return NextResponse.json({ error: "Missing UID" }, { status: 400 });

        // 1. Delete from Auth
        await auth.deleteUser(uid);

        // 2. Delete from Firestore
        await db.collection('users').doc(uid).delete();

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
