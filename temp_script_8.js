
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
        import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, limit, setDoc, onSnapshot, getDoc, runTransaction, enableMultiTabIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
        import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
        import { getStorage, ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

        import { firebaseConfig } from "./firebase-env.js";

        try {
            const app = initializeApp(firebaseConfig);
            window.db = getFirestore(app);
            enableMultiTabIndexedDbPersistence(window.db).catch((err) => {
                if (err.code == 'failed-precondition') {
                    console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
                } else if (err.code == 'unimplemented') {
                    console.warn("Browser does not support persistence");
                }
            });
            window.auth = getAuth(app);
            window.storage = getStorage(app);

            window.firebaseAPI = {
                initializeApp, getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword, signInAnonymously, onAuthStateChanged,
                db: window.db, auth: window.auth, storage: window.storage, firebaseConfig,
                collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, limit, setDoc, onSnapshot, getDoc, runTransaction,
                signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, createUserWithEmailAndPassword,
                getStorage, ref, uploadString, getDownloadURL,
                firebaseConfig
            };
            console.log("Firebase initialized successfully.");

            onAuthStateChanged(window.auth, (user) => {
                if (!user) {
                    localStorage.removeItem('student_auth_v1');
                    window.location.replace('Login_Panel.html?msg=session_expired');
                } else if (user.email && (user.email.toLowerCase().includes('admin') || user.email.toLowerCase() === 'identify.jvd@gmail.com')) {
                    window.location.replace('Admin_Panel.html');
                }
            });
        } catch (e) {
            console.error("Firebase initialization error:", e);
        }
    