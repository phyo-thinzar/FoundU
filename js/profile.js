
console.log("Profile JS is running!");

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut,
    updateProfile,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// ========================================
// ELEMENTS
// ========================================

const profileAvatar = document.getElementById("profile-avatar");
const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");

const displayName = document.getElementById("display-name");
const displayEmail = document.getElementById("display-email");
const displayId = document.getElementById("display-id");

const editName = document.getElementById("edit-name");
const saveProfile = document.getElementById("save-profile");

const logoutButton = document.getElementById("logout-button");
const profileMessage = document.getElementById("profile-message");


// ========================================
// CHANGE PASSWORD ELEMENTS
// ========================================

const changePasswordButton =
    document.getElementById("change-password");

const currentPasswordInput =
    document.getElementById("current-password");

const newPasswordInput =
    document.getElementById("new-password");

const confirmPasswordInput =
    document.getElementById("confirm-password");

const passwordMessage =
    document.getElementById("password-message");


// ========================================
// DEBUG - CHECK PASSWORD HTML
// ========================================

console.log(
    "Change password button:",
    changePasswordButton
);

console.log(
    "Current password input:",
    currentPasswordInput
);

console.log(
    "New password input:",
    newPasswordInput
);

console.log(
    "Confirm password input:",
    confirmPasswordInput
);

console.log(
    "Password message:",
    passwordMessage
);


// ========================================
// CURRENT USER
// ========================================

let currentUser = null;


// ========================================
// AUTHENTICATION
// ========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        console.log("No user logged in.");

        window.location.href = "login.html";

        return;
    }


    // Save current user
    currentUser = user;


    console.log(
        "Logged in:",
        user.email
    );

    console.log(
        "UID:",
        user.uid
    );


    // ========================================
    // CHECK PROVIDER
    // ========================================

    console.log(
        "Provider data:",
        user.providerData
    );

    const hasPasswordProvider =
        user.providerData.some(
            (provider) =>
                provider.providerId === "password"
        );


    console.log(
        "Has password provider:",
        hasPasswordProvider
    );


    // ========================================
    // SETUP PASSWORD FIRST
    // ========================================
    // We do this BEFORE Firestore profile loading.
    // This means the password button will still
    // work even if there is a Firestore problem.

    setupPasswordSection(user);


    // ========================================
    // LOAD PROFILE
    // ========================================

    await loadProfile(user);

});


// ========================================
// LOAD PROFILE
// ========================================

async function loadProfile(user) {

    try {

        const userRef = doc(
            db,
            "users",
            user.uid
        );

        const userSnapshot = await getDoc(userRef);

        let name = "Student";
        let studentId = "Not provided";


        // ========================================
        // EXISTING USER PROFILE
        // ========================================

        if (userSnapshot.exists()) {

            const userData =
                userSnapshot.data();

            console.log(
                "User profile:",
                userData
            );


            name =
                userData.name ||
                userData.displayName ||
                user.displayName ||
                "Student";


            studentId =
                userData.studentId ||
                "Not provided";

        }


        // ========================================
        // CREATE MISSING PROFILE
        // ========================================

        else {

            console.log(
                "User document does not exist. Creating profile..."
            );


            name =
                user.displayName ||
                "Student";


            await setDoc(
                userRef,
                {
                    name: name,

                    studentId: "",

                    email:
                        user.email || "",

                    photoURL:
                        user.photoURL || "",

                    provider:
                        user.providerData?.[0]?.providerId ||
                        "password",

                    createdAt:
                        serverTimestamp()
                }
            );


            console.log(
                "User profile created."
            );
        }


        // ========================================
        // DISPLAY PROFILE
        // ========================================

        if (profileName) {
            profileName.textContent = name;
        }

        if (profileEmail) {
            profileEmail.textContent =
                user.email || "No email";
        }

        if (displayName) {
            displayName.textContent = name;
        }

        if (displayEmail) {
            displayEmail.textContent =
                user.email || "No email";
        }


        // ========================================
        // STUDENT ID
        // ========================================

        if (displayId) {
            displayId.textContent = studentId;
        }


        // ========================================
        // EDIT NAME
        // ========================================

        if (editName) {
            editName.value = name;
        }


        // ========================================
        // AVATAR
        // ========================================

        if (profileAvatar) {
            profileAvatar.textContent =
                getInitial(name);
        }


    } catch (error) {

        console.error(
            "Error loading profile:",
            error
        );


        if (profileMessage) {
            profileMessage.textContent =
                "Failed to load profile.";
        }
    }
}


// ========================================
// SAVE PROFILE
// ========================================

if (saveProfile) {

    saveProfile.addEventListener(
        "click",
        async () => {

            if (!currentUser) {
                return;
            }


            const newName =
                editName.value.trim();


            // ========================================
            // VALIDATION
            // ========================================

            if (!newName) {

                profileMessage.textContent =
                    "Please enter your name.";

                return;
            }


            if (newName.length < 2) {

                profileMessage.textContent =
                    "Name must be at least 2 characters.";

                return;
            }


            try {

                saveProfile.disabled = true;

                saveProfile.textContent =
                    "Saving...";


                // ========================================
                // FIRESTORE
                // ========================================

                const userRef = doc(
                    db,
                    "users",
                    currentUser.uid
                );


                await setDoc(
                    userRef,
                    {
                        name: newName,

                        email:
                            currentUser.email || "",

                        photoURL:
                            currentUser.photoURL || "",

                        provider:
                            currentUser.providerData?.[0]?.providerId ||
                            "password"
                    },
                    {
                        merge: true
                    }
                );


                // ========================================
                // FIREBASE AUTH PROFILE
                // ========================================

                await updateProfile(
                    currentUser,
                    {
                        displayName: newName
                    }
                );


                // ========================================
                // UPDATE SCREEN
                // ========================================

                if (profileName) {
                    profileName.textContent =
                        newName;
                }

                if (displayName) {
                    displayName.textContent =
                        newName;
                }

                editName.value =
                    newName;

                if (profileAvatar) {
                    profileAvatar.textContent =
                        getInitial(newName);
                }


                profileMessage.textContent =
                    "Profile updated successfully!";


                console.log(
                    "Profile updated:",
                    newName
                );


            } catch (error) {

                console.error(
                    "Update profile error:",
                    error
                );


                profileMessage.textContent =
                    "Failed to update profile.";


            } finally {

                saveProfile.disabled =
                    false;

                saveProfile.textContent =
                    "Save Changes";
            }
        }
    );
}


// ========================================
// SETUP PASSWORD SECTION
// ========================================

function setupPasswordSection(user) {

    console.log(
        "Setting up Change Password..."
    );


    // ========================================
    // CHECK HTML ELEMENTS
    // ========================================

    if (
        !changePasswordButton ||
        !currentPasswordInput ||
        !newPasswordInput ||
        !confirmPasswordInput ||
        !passwordMessage
    ) {

        console.error(
            "Change Password elements are missing."
        );

        return;
    }


    console.log(
        "All Change Password elements found."
    );


    // ========================================
    // CHECK LOGIN PROVIDER
    // ========================================

    const passwordProvider =
        user.providerData.some(
            (provider) =>
                provider.providerId === "password"
        );


    console.log(
        "Password provider:",
        passwordProvider
    );


    // ========================================
    // GOOGLE / OTHER SOCIAL ACCOUNT
    // ========================================

    if (!passwordProvider) {

        currentPasswordInput.disabled =
            true;

        newPasswordInput.disabled =
            true;

        confirmPasswordInput.disabled =
            true;

        changePasswordButton.disabled =
            true;


        passwordMessage.textContent =
            "Your password is managed by your sign-in provider.";


        console.log(
            "Change Password disabled because this is not an email/password account."
        );


        return;
    }


    // ========================================
    // EMAIL/PASSWORD ACCOUNT
    // ========================================

    currentPasswordInput.disabled =
        false;

    newPasswordInput.disabled =
        false;

    confirmPasswordInput.disabled =
        false;

    changePasswordButton.disabled =
        false;


    // Prevent duplicate listeners
    changePasswordButton.onclick =
        changePassword;


    console.log(
        "Change Password is ready."
    );
}


// ========================================
// CHANGE PASSWORD
// ========================================

async function changePassword() {

    console.log(
        "Change Password button clicked!"
    );


    if (!currentUser) {

        console.error(
            "No current user."
        );

        return;
    }


    const currentPassword =
        currentPasswordInput.value.trim();

    const newPassword =
        newPasswordInput.value.trim();

    const confirmPassword =
        confirmPasswordInput.value.trim();


    // ========================================
    // CLEAR MESSAGE
    // ========================================

    passwordMessage.textContent = "";

    passwordMessage.className =
        "form-message";


    // ========================================
    // VALIDATION
    // ========================================

    if (!currentPassword) {

        passwordMessage.textContent =
            "Please enter your current password.";

        currentPasswordInput.focus();

        return;
    }


    if (!newPassword) {

        passwordMessage.textContent =
            "Please enter a new password.";

        newPasswordInput.focus();

        return;
    }


    if (newPassword.length < 6) {

        passwordMessage.textContent =
            "New password must be at least 6 characters.";

        newPasswordInput.focus();

        return;
    }


    if (!confirmPassword) {

        passwordMessage.textContent =
            "Please confirm your new password.";

        confirmPasswordInput.focus();

        return;
    }


    if (newPassword !== confirmPassword) {

        passwordMessage.textContent =
            "New passwords do not match.";

        confirmPasswordInput.focus();

        return;
    }


    if (currentPassword === newPassword) {

        passwordMessage.textContent =
            "New password must be different from your current password.";

        return;
    }


    try {

        // ========================================
        // DISABLE BUTTON
        // ========================================

        changePasswordButton.disabled =
            true;

        changePasswordButton.textContent =
            "Changing Password...";


        // ========================================
        // CHECK EMAIL
        // ========================================

        if (!currentUser.email) {

            passwordMessage.textContent =
                "Your account does not have an email address.";

            return;
        }


        // ========================================
        // CREATE EMAIL/PASSWORD CREDENTIAL
        // ========================================

        const credential =
            EmailAuthProvider.credential(
                currentUser.email,
                currentPassword
            );


        console.log(
            "Re-authenticating user..."
        );


        // ========================================
        // RE-AUTHENTICATE
        // ========================================

        await reauthenticateWithCredential(
            currentUser,
            credential
        );


        console.log(
            "Re-authentication successful."
        );


        // ========================================
        // UPDATE PASSWORD
        // ========================================

        console.log(
            "Updating password..."
        );


        await updatePassword(
            currentUser,
            newPassword
        );


        // ========================================
        // SUCCESS
        // ========================================

        console.log(
            "Password changed successfully!"
        );


        passwordMessage.textContent =
            "Password changed successfully!";

        passwordMessage.classList.add(
            "success"
        );


        // ========================================
        // CLEAR INPUTS
        // ========================================

        currentPasswordInput.value =
            "";

        newPasswordInput.value =
            "";

        confirmPasswordInput.value =
            "";


    } catch (error) {

        console.error(
            "Change password error:",
            error
        );


        console.error(
            "Firebase error code:",
            error.code
        );


        console.error(
            "Firebase error message:",
            error.message
        );


        // ========================================
        // ERROR HANDLING
        // ========================================

        switch (error.code) {

            case "auth/invalid-credential":

                passwordMessage.textContent =
                    "Current password is incorrect.";

                break;


            case "auth/wrong-password":

                passwordMessage.textContent =
                    "Current password is incorrect.";

                break;


            case "auth/weak-password":

                passwordMessage.textContent =
                    "New password is too weak.";

                break;


            case "auth/password-does-not-meet-requirements":

                passwordMessage.textContent =
                    "Password does not meet the required security rules.";

                break;


            case "auth/requires-recent-login":

                passwordMessage.textContent =
                    "Please log out and log in again before changing your password.";

                break;


            case "auth/too-many-requests":

                passwordMessage.textContent =
                    "Too many attempts. Please try again later.";

                break;


            case "auth/user-mismatch":

                passwordMessage.textContent =
                    "The account information does not match.";

                break;


            case "auth/network-request-failed":

                passwordMessage.textContent =
                    "Network error. Please check your internet connection.";

                break;


            default:

                passwordMessage.textContent =
                    "Unable to change password: " +
                    error.message;

                break;
        }


    } finally {

        changePasswordButton.disabled =
            false;

        changePasswordButton.textContent =
            "Change Password";
    }
}


// ========================================
// LOGOUT
// ========================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            const confirmed =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmed) {
                return;
            }


            try {

                await signOut(auth);


                console.log(
                    "User logged out."
                );


                window.location.href =
                    "login.html";


            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


                if (profileMessage) {
                    profileMessage.textContent =
                        "Failed to logout.";
                }
            }
        }
    );
}


// ========================================
// GET INITIAL
// ========================================

function getInitial(name) {

    if (!name) {
        return "?";
    }


    return name
        .charAt(0)
        .toUpperCase();
}
