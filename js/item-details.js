
console.log("Item Details JS is running!");

import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

let currentLoadedItem = null;

// ========================================
// GET SELECTED ITEM ID
// ========================================

const urlParams = new URLSearchParams(
    window.location.search
);

const itemId =
    urlParams.get("id") ||
    localStorage.getItem("selectedItemId");

console.log("Selected item ID:", itemId);

// ========================================
// ELEMENTS
// ========================================

const detailsImage =
    document.querySelector(".details-image");

const detailsContent =
    document.querySelector(".details-content");

const detailsMessage =
    document.getElementById("details-message");

// ========================================
// CHECK REQUIRED ELEMENTS
// ========================================

if (!detailsImage || !detailsContent) {

    console.error(
        "❌ Item details HTML elements are missing."
    );

} else if (!itemId) {

    // ========================================
    // NO ITEM SELECTED
    // ========================================

    console.error("❌ No item ID found.");

    detailsContent.innerHTML = `
        <div class="no-reports">

            <h2>${t("itemNotFound")}</h2>

            <p>
                ${t("noItemSelected")}
            </p>

            <a
                href="search.html"
                class="btn primary-btn"
            >
                Back to Search
            </a>

        </div>
    `;

} else {

    // ========================================
    // LOAD ITEM
    // ========================================

    loadItem(itemId);
}

// ========================================
// LOAD ITEM
// ========================================

async function loadItem(id) {

    try {

        console.log("Loading item:", id);

        const itemRef =
            doc(db, "items", id);

        const itemSnapshot =
            await getDoc(itemRef);

        // ========================================
        // ITEM DOES NOT EXIST
        // ========================================

        if (!itemSnapshot.exists()) {

            console.error(
                "❌ Item does not exist."
            );

            detailsContent.innerHTML = `
                <div class="no-reports">

                    <h2>${t("itmeNotFound")}</h2>

                    <p>
                        This item may have been deleted.
                    </p>

                    <a
                        href="search.html"
                        class="btn primary-btn"
                    >
                        Back to Search
                    </a>

                </div>
            `;

            return;
        }

        // ========================================
        // GET ITEM DATA
        // ========================================

        const item = {
            id: itemSnapshot.id,
            ...itemSnapshot.data()
        };

        // Load reporter name from the user's Firestore profile.
        if (item.userId) {
            try {
                const reporterSnapshot = await getDoc(
                    doc(db, "users", item.userId)
                );

                if (reporterSnapshot.exists()) {
                    item.userName =
                        reporterSnapshot.data().name || "FoundU User";
                }
            } catch (profileError) {
                console.warn("Could not load reporter profile:", profileError);
            }
        }

        console.log(
            "✅ Item loaded:",
            item
        );

        // ========================================
        // DISPLAY ITEM
        // ========================================

        currentLoadedItem = item;
        displayItem(item);

    } catch (error) {

        console.error(
            "❌ Error loading item:",
            error
        );

        detailsContent.innerHTML = `
            <div class="no-reports">

                <h2>${t("failedToLoadItem")}</h2>

                <p>
                    ${t("tryAgain")}
                </p>

                <a
                    href="search.html"
                    class="btn primary-btn"
                >
                    Back to Search
                </a>

            </div>
        `;
    }
}

// ========================================
// DISPLAY ITEM
// ========================================

function displayItem(item) {

    // ========================================
    // IMAGE
    // ========================================

    if (item.imageURL) {

        detailsImage.innerHTML = `
            <img
                src="${escapeHTML(item.imageURL)}"
                alt="${escapeHTML(
                    item.itemName || "Item"
                )}"
            >
        `;

    } else {

        detailsImage.innerHTML = `
            <div class="details-image-placeholder">
                ${t("noImageAvailabe")}
            </div>
        `;
    }

    // ========================================
    // TYPE
    // ========================================

    const type =
        item.type || "unknown";

    // ========================================
    // STATUS
    // ========================================

    const status =
        item.status || "active";

    // ========================================
    // DATE
    // ========================================

    let dateLabel = t("date");
    let dateValue = t("unknow");

    if (type === "lost") {

        dateLabel = t("dateLost");

        dateValue =
            formatDate(item.lostDate);

    } else if (type === "found") {

        dateLabel = t("dateFound");

        dateValue =
            formatDate(item.foundDate);
    }

    // ========================================
    // REPORTER / DIRECT CHAT
    // ========================================

    const reporterId = item.userId || "";
    const reporterName = item.userName || "FoundU User";

    // ========================================
    // CONTENT
    // ========================================

    detailsContent.innerHTML = `

        <!-- TYPE -->

        <span class="item-status ${escapeHTML(type)}">
            ${type === "lost" ? t("lost") : type === "found" ? t("found") : capitalize(type)}
        </span>

        <!-- STATUS -->

        <span class="report-status ${escapeHTML(status)}">
            ${status === "active" ? t("active") : status === "resolved" ? t("resolved") : capitalize(status)}
        </span>

        <!-- ITEM NAME -->

        <h1>
            ${escapeHTML(
                item.itemName ||
                "Unnamed Item"
            )}
        </h1>

        <!-- INFORMATION -->

        <div class="item-info">

            <div class="info-row">

                <strong>
                    ${t("category")}
                </strong>

                <span>
                    ${escapeHTML(
                        item.category ||
                        "Other"
                    )}
                </span>

            </div>

            <div class="info-row">

                <strong>
                    ${t("location")}
                </strong>

                <span>
                    ${escapeHTML(
                        item.location ||
                        "Unknown"
                    )}
                </span>

            </div>

            <div class="info-row">

                <strong>
                    ${dateLabel}
                </strong>

                <span>
                    ${escapeHTML(dateValue)}
                </span>

            </div>

        </div>

        <!-- DESCRIPTION -->

        <div class="description">

            <h2>
                ${t("description")}
            </h2>

            <p>
                ${escapeHTML(
                    item.description ||
                    t("noDescription")
                )}
            </p>

        </div>

        <!-- REPORTER -->

        <div class="reporter">

            <h2>${t("reportBy")}</h2>

            <div class="reporter-info">

                <div class="reporter-avatar">
                    ${getInitial(reporterName)}
                </div>

                <div>
                    <h3>${escapeHTML(reporterName)}</h3>
                    <p>${t("foundUUser")}</p>
                </div>

            </div>

        </div>

        <!-- DIRECT CHAT BUTTON -->

        ${
            reporterId && reporterId !== auth.currentUser?.uid
                ? `
                    <button
                        type="button"
                        class="btn primary-btn contact-btn"
                        id="contact-button"
                    >
                        ${t("chatWithReporter")}
                    </button>
                `
                : reporterId && reporterId === auth.currentUser?.uid
                ? `
                    <a
                        href="chats.html"
                        class="btn secondary-btn contact-btn"
                        style="display: flex; align-items: center; justify-content: center; text-decoration: none;"
                        data-i18n="messages"
                    >
                        ${t("messages")}
                    </a>
                `
                : `
                    <p class="form-message">
                        ${t("chatUnavailable")}
                    </p>
                `
        }

    `;

    // ========================================
    // VERIFY BUTTON WAS CREATED
    // ========================================

    const contactButton =
        document.getElementById("contact-button");

    console.log(
        "Contact button:",
        contactButton
    );

    // ========================================
    // SETUP CONTACT MODAL
    // ========================================

    setupContactModal(item);
}

// ========================================
// DIRECT CHAT
// ========================================

function setupContactModal(item) {

    const contactButton =
        document.getElementById("contact-button");

    if (!contactButton || !item.userId) {
        return;
    }

    contactButton.addEventListener("click", () => {

        if (!auth.currentUser) {
            window.location.href = "login.html";
            return;
        }

        if (item.userId === auth.currentUser.uid) {
            return;
        }

        const params = new URLSearchParams({
            userId: item.userId,
            itemId: item.id || "",
            itemName: item.itemName || ""
        });

        window.location.href = `chat.html?${params.toString()}`;
    });
}

// ========================================
// FORMAT DATE
// ========================================

function formatDate(dateValue) {

    if (!dateValue) {

        return "Unknown";
    }

    // ========================================
    // FIRESTORE TIMESTAMP
    // ========================================

    if (
        typeof dateValue === "object" &&
        typeof dateValue.toDate === "function"
    ) {

        return dateValue
            .toDate()
            .toLocaleDateString(
                "en-US",
                {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            );
    }

    // ========================================
    // NORMAL DATE
    // ========================================

    const date =
        new Date(dateValue);

    if (isNaN(date.getTime())) {

        return String(dateValue);
    }

    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}

// ========================================
// CAPITALIZE
// ========================================

function capitalize(text) {

    if (!text) {

        return "";
    }

    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );
}

// ========================================
// GET INITIAL
// ========================================

function getInitial(email) {

    if (!email) {

        return "?";
    }

    return email
        .charAt(0)
        .toUpperCase();
}

// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        String(text ?? "");

    return div.innerHTML;
}

onAuthStateChanged(auth, () => {
    if (currentLoadedItem) {
        displayItem(currentLoadedItem);
    }
});
