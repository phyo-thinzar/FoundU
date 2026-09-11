import { resetPassword } from "./auth.js";

const forgotPasswordLink = document.getElementById("forgot-password-link");

if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", async (event) => {
        event.preventDefault();

        const emailInput = document.getElementById("email");
        const email = emailInput.value.trim();

        if (!email) {
            alert("Please enter your email address first.");
            emailInput.focus();
            return;
        }

        await resetPassword(email);
    });
}