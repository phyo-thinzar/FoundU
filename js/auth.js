import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    OAuthProvider,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


console.log("FoundU auth.js is running!");


// ========================================
// HELPER FUNCTIONS
// ========================================

function showMessage(elementId, message, type = "error") {

    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = message;
    element.className = `auth-message ${type}`;
}


function clearMessage(elementId) {

    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = "";
    element.className = "auth-message";
}


function setButtonLoading(button, loading, loadingText = "Please wait...") {

    if (!button) return;

    if (loading) {

        button.dataset.originalText = button.textContent;

        button.disabled = true;

        button.innerHTML = `
            <span class="loading-spinner"></span>
            ${loadingText}
        `;

    } else {

        button.disabled = false;

        button.textContent =
            button.dataset.originalText || "Continue";
    }
}


// ========================================
// CREATE / UPDATE FIRESTORE USER PROFILE
// ========================================

async function createUserProfile(user, extraData = {}) {

    const userRef = doc(db, "users", user.uid);

    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {

        await setDoc(userRef, {

            name:
                extraData.name ||
                user.displayName ||
                "FoundU User",

            studentId:
                extraData.studentId || "",

            email:
                user.email || "",

            photoURL:
                user.photoURL || "",

            provider:
                user.providerData?.[0]?.providerId || "unknown",

            createdAt:
                serverTimestamp()

        });

        console.log("Firestore user profile created.");

    } else {

        console.log("Firestore user profile already exists.");

    }
}


// ========================================
// REGISTER
// ========================================

const registerForm =
    document.getElementById("register-form");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            clearMessage("register-message");

            const name =
                document.getElementById("name")
                    .value.trim();

            const studentId =
                document.getElementById("student-id")
                    .value.trim();

            const email =
                document.getElementById("register-email")
                    .value.trim();

            const password =
                document.getElementById("register-password")
                    .value;

            const confirmPassword =
                document.getElementById("confirm-password")
                    .value;

            const registerButton =
                document.getElementById("register-btn");


            // Password check
            if (password !== confirmPassword) {

                showMessage(
                    "register-message",
                    "Passwords do not match."
                );

                return;
            }


            if (password.length < 6) {

                showMessage(
                    "register-message",
                    "Password must be at least 6 characters."
                );

                return;
            }


            try {

                setButtonLoading(
                    registerButton,
                    true,
                    "Creating account..."
                );


                // Create Firebase account
                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                console.log(
                    "Authentication account created:",
                    user.uid
                );


                // Create Firestore profile
                await setDoc(
                    doc(db, "users", user.uid),
                    {

                        name: name,

                        studentId: studentId,

                        email: email,

                        photoURL: "",

                        provider: "password",

                        createdAt:
                            serverTimestamp()
                    }
                );


                showMessage(
                    "register-message",
                    "Account created successfully! Redirecting...",
                    "success"
                );


                setTimeout(() => {

                    window.location.href =
                        "dashboard.html";

                }, 1000);


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );


                switch (error.code) {

                    case "auth/email-already-in-use":

                        showMessage(
                            "register-message",
                            "This email is already registered."
                        );

                        break;


                    case "auth/invalid-email":

                        showMessage(
                            "register-message",
                            "Please enter a valid email address."
                        );

                        break;


                    case "auth/weak-password":

                        showMessage(
                            "register-message",
                            "Password is too weak."
                        );

                        break;


                    default:

                        showMessage(
                            "register-message",
                            "Registration failed. Please try again."
                        );
                }

            } finally {

                setButtonLoading(
                    registerButton,
                    false
                );
            }
        }
    );
}


// ========================================
// LOGIN
// ========================================

const loginForm = document.getElementById("login-form");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        clearMessage("login-message");

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const loginButton = document.getElementById("login-btn");

        if (!email || !password) {
            showMessage(
                "login-message",
                "Please enter your email and password."
            );
            return;
        }

        try {
            setButtonLoading(
                loginButton,
                true,
                "Signing in..."
            );

            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            console.log(
                "Login successful:",
                userCredential.user.email
            );

            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Login error:", error);

            // Firebase login errors
            switch (error.code) {

                case "auth/invalid-credential":
                case "auth/wrong-password":
                    showMessage(
                        "login-message",
                        "Incorrect email or password."
                    );
                    break;

                case "auth/user-not-found":
                    showMessage(
                        "login-message",
                        "Incorrect email or password."
                    );
                    break;

                case "auth/invalid-email":
                    showMessage(
                        "login-message",
                        "Please enter a valid email address."
                    );
                    break;

                case "auth/user-disabled":
                    showMessage(
                        "login-message",
                        "This account has been disabled."
                    );
                    break;

                case "auth/too-many-requests":
                    showMessage(
                        "login-message",
                        "Too many failed attempts. Please try again later."
                    );
                    break;

                case "auth/network-request-failed":
                    showMessage(
                        "login-message",
                        "Network error. Please check your internet connection."
                    );
                    break;

                default:
                    showMessage(
                        "login-message",
                        "Login failed. Please check your email and password."
                    );
            }

        } finally {
            setButtonLoading(
                loginButton,
                false
            );
        }
    });
}

// ========================================
// SOCIAL LOGIN
// ========================================

async function socialLogin(provider) {

    try {

        const result =
            await signInWithPopup(
                auth,
                provider
            );


        const user =
            result.user;


        console.log(
            "Social login successful:",
            user.email
        );


        // Create Firestore profile
        await createUserProfile(user);


        window.location.href =
            "dashboard.html";


    } catch (error) {

        console.error(
            "Social login error:",
            error
        );


        handleAuthError(error);
    }
}


// ========================================
// GOOGLE LOGIN
// ========================================

async function loginWithGoogle() {

    const provider =
        new GoogleAuthProvider();

    await socialLogin(provider);
}


// ========================================
// LOGIN BUTTONS
// ========================================

const googleLogin =
    document.getElementById("google-login");

const microsoftLogin =
    document.getElementById("microsoft-login");

const appleLogin =
    document.getElementById("apple-login");


if (googleLogin) {

    googleLogin.addEventListener(
        "click",
        loginWithGoogle
    );
}


// ========================================
// REGISTER SOCIAL BUTTONS
// ========================================

const googleRegister =
    document.getElementById("google-register");

const microsoftRegister =
    document.getElementById("microsoft-register");

const appleRegister =
    document.getElementById("apple-register");


if (googleRegister) {

    googleRegister.addEventListener(
        "click",
        loginWithGoogle
    );
}


// ========================================
// FORGOT PASSWORD
// ========================================

const forgotPassword =
    document.getElementById("forgot-password");


if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        async () => {

            const emailInput =
                document.getElementById("email");

            const email =
                emailInput?.value.trim();


            if (!email) {

                showMessage(
                    "login-message",
                    "Enter your email address first."
                );

                emailInput?.focus();

                return;
            }


            try {

                await sendPasswordResetEmail(
                    auth,
                    email
                );


                showMessage(
                    "login-message",
                    "Password reset email sent. Check your inbox.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Password reset error:",
                    error
                );


                if (
                    error.code ===
                    "auth/invalid-email"
                ) {

                    showMessage(
                        "login-message",
                        "Please enter a valid email address."
                    );

                } else {

                    showMessage(
                        "login-message",
                        "Unable to send reset email. Please try again."
                    );
                }
            }
        }
    );
}


// ========================================
// SHOW / HIDE PASSWORD
// ========================================

function setupPasswordToggle(
    buttonId,
    inputId
) {

    const button =
        document.getElementById(buttonId);

    const input =
        document.getElementById(inputId);


    if (!button || !input) return;


    button.addEventListener(
        "click",
        () => {

            if (input.type === "password") {

                input.type = "text";

                button.textContent = "🙈";

            } else {

                input.type = "password";

                button.textContent = "👁";
            }
        }
    );
}




// ========================================
// AUTH ERROR HANDLER
// ========================================

function handleAuthError(error) {

    let message =
        "Authentication failed. Please try again.";


    switch (error.code) {

        case "auth/popup-closed-by-user":

            message =
                "Sign-in was cancelled.";

            break;


        case "auth/popup-blocked":

            message =
                "Your browser blocked the sign-in popup.";

            break;


        case "auth/account-exists-with-different-credential":

            message =
                "An account already exists with this email using another sign-in method.";

            break;


        case "auth/unauthorized-domain":

            message =
                "This website domain is not authorized in Firebase.";

            break;


        case "auth/operation-not-allowed":

            message =
                "This sign-in method is not enabled in Firebase.";

            break;


        case "auth/network-request-failed":

            message =
                "Network error. Please check your connection.";

            break;
    }


    if (document.getElementById("login-message")) {

        showMessage(
            "login-message",
            message
        );

    } else if (document.getElementById("register-message")) {

        showMessage(
            "register-message",
            message
        );

    } else {

        alert(message);
    }
}


// ========================================
// LOGOUT
// ========================================

const logoutButton =
    document.getElementById("logout-btn");


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                console.log(
                    "Logout successful"
                );

                window.location.href =
                    "login.html";


            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                alert(
                    "Logout failed."
                );
            }
        }
    );
}


// ========================================
// AUTH STATE
// ========================================

onAuthStateChanged(
    auth,
    (user) => {

        if (user) {

            console.log(
                "User is logged in:",
                user.email
            );

        } else {

            console.log(
                "No user is logged in."
            );
        }
    }
);

// SHOW / HIDE LOGIN PASSWORD
const togglePassword = document.getElementById("toggle-password");
const passwordInput = document.getElementById("password");

if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";

        passwordInput.type = isPassword ? "text" : "password";

        togglePassword.innerHTML = isPassword
            ? '<i class="fa-solid fa-eye-slash"></i>'
            : '<i class="fa-solid fa-eye"></i>';

        togglePassword.setAttribute(
            "aria-label",
            isPassword ? "Hide password" : "Show password"
        );
    });

}