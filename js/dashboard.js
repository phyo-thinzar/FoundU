console.log("Dashboard.js is running!");

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    query,
    orderBy,
    limit,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// ========================================
// ELEMENTS
// ========================================

const welcomeMessage =
    document.getElementById("welcome-message");

const recentItemsContainer =
    document.getElementById("recent-items-container");

console.log(
    "Welcome element:",
    welcomeMessage
);

console.log(
    "Recent items container:",
    recentItemsContainer
);


// ========================================
// LOAD RECENT ITEMS
// ========================================

async function loadRecentItems() {

    console.log("Loading recent items...");

    try {

        const itemsRef =
            collection(db, "items");


        // Get newest 6 items
        const itemsQuery = query(
            itemsRef,
            orderBy("createdAt", "desc"),
            limit(6)
        );


        const querySnapshot =
            await getDocs(itemsQuery);


        console.log(
            "Number of items:",
            querySnapshot.size
        );


        // Clear old content
        recentItemsContainer.innerHTML = "";


        // ========================================
        // NO ITEMS
        // ========================================

        if (querySnapshot.empty) {

            recentItemsContainer.innerHTML = `
                <p class="no-items">
                    ${t("noLostFoundItems")}
                </p>
            `;

            return;
        }


        // ========================================
        // DISPLAY ITEMS
        // ========================================

        querySnapshot.forEach((itemDoc) => {

            const item =
                itemDoc.data();

            item.id = itemDoc.id;


            console.log(
                "Item:",
                item
            );


            // ========================================
            // CREATE CARD
            // ========================================

            const article =
                document.createElement("article");

            article.className =
                "item-card";


            // ========================================
            // TYPE
            // ========================================

            const typeClass =
                item.type === "lost"
                    ? "lost"
                    : "found";


            // ========================================
            // DATE
            // ========================================

            let formattedDate = "";


            if (item.createdAt) {

                formattedDate =
                    item.createdAt
                        .toDate()
                        .toLocaleDateString(
                            "en-US",
                            {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                            }
                        );
            }


            // ========================================
            // IMAGE
            // ========================================

            let imageHTML = `
                <div class="item-image">
                    <span>${t("itemPhoto")}</span>
                </div>
            `;


            // Check if image URL exists
            if (
                item.imageURL &&
                item.imageURL.trim() !== ""
            ) {

                imageHTML = `
                    <div class="item-image">
                        <img
                            src="${item.imageURL}"
                            alt="${item.itemName || "Item photo"}"
                            loading="lazy"
                        >
                    </div>
                `;

            }


            // ========================================
            // CARD CONTENT
            // ========================================

            article.innerHTML = `

                ${imageHTML}

                <div class="item-content">

                    <span class="item-status ${typeClass}">
                        ${item.type === "lost"
                    ? t("lost")
                    : item.type === "found"
                        ? t("found")
                        : t("unknown")
                }
                    </span>


                    <h3>
                        ${item.itemName || t("unnamedItem")}
                    </h3>


                    <p>
                        ${item.location || t("locationNotProvided")}
                    </p>


                    <small>
                        ${formattedDate}
                    </small>

                </div>

            `;

// ========================================
// CLICK RECENT ITEM
// ========================================

article.style.cursor = "pointer";

article.onclick = function () {

    console.log("================================");
    console.log("🖱️ RECENT ITEM CLICKED");
    console.log("Item name:", item.itemName);
    console.log("Item ID:", item.id);
    console.log("================================");

    if (!item.id) {
        console.error("❌ Item ID is missing!");
        return;
    }

    // Save ID as backup
    localStorage.setItem(
        "selectedItemId",
        item.id
    );

    // Open item details directly with ID
    const detailsURL =
        `item-details.html?id=${encodeURIComponent(item.id)}`;

    console.log("➡️ Opening:", detailsURL);

    window.location.assign(detailsURL);
};


            // Add card to dashboard
            recentItemsContainer.appendChild(
                article
            );

        });

    } catch (error) {

        console.error(
            "❌ Error loading items:",
            error
        );


        recentItemsContainer.innerHTML = `
            <p class="error-message">
                ${t("unableToLoadItems")}
            </p>
        `;
    }
}


// ========================================
// AUTHENTICATION
// ========================================

onAuthStateChanged(
    auth,
    async (user) => {

        console.log(
            "Auth state:",
            user
        );


        // ========================================
        // USER NOT LOGGED IN
        // ========================================

        if (!user) {

            console.log(
                "No user is logged in."
            );

            return;
        }


        console.log(
            "Logged-in email:",
            user.email
        );


        console.log(
            "Logged-in UID:",
            user.uid
        );


        // ========================================
        // LOAD USER PROFILE
        // ========================================

        try {

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            console.log(
                "Reading Firestore:",
                "users/" + user.uid
            );


            const userDoc =
                await getDoc(userRef);


            console.log(
                "Document exists:",
                userDoc.exists()
            );


            if (userDoc.exists()) {

                const userData =
                    userDoc.data();


                console.log(
                    "User data:",
                    userData
                );


                welcomeMessage.textContent =
                    getLanguage() === "th"
                        ? `สวัสดี ${userData.name} 👋`
                        : `Hello, ${userData.name} 👋`;

            }


            // ========================================
            // LOAD RECENT ITEMS
            // ========================================

            await loadRecentItems();

        } catch (error) {

            console.error(
                "❌ Firestore error:",
                error
            );

        }

    }
);
