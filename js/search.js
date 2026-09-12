console.log("Search JS is running!");

import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// ========================================
// ELEMENTS
// ========================================
const searchInput =
    document.getElementById("search-input");

const searchButton =
    document.getElementById("search-button");

const categoryFilter =
    document.getElementById("category-filter");

const typeFilter =
    document.getElementById("type-filter");

const statusFilter =
    document.getElementById("status-filter");

const locationFilter =
    document.getElementById("location-filter");
    
const resultsContainer =
    document.getElementById("items-container");

const searchMessage =
    document.getElementById("search-message");


console.log("Search input:", searchInput);
console.log("Search button:", searchButton);
console.log("Category filter:", categoryFilter);
console.log("Type filter:", typeFilter);
console.log("Status filter:", statusFilter);
console.log("Location filter:", locationFilter);
console.log("Results container:", resultsContainer);


// ========================================
// CHECK ELEMENTS
// ========================================

if (
    !searchInput ||
    !searchButton ||
    !categoryFilter ||
    !typeFilter ||
    !statusFilter ||
    !locationFilter ||
    !resultsContainer
) {
    console.error(
        "❌ One or more HTML elements were not found."
    );
}


// ========================================
// ALL ITEMS
// ========================================

let allItems = [];


// ========================================
// LOAD ITEMS FROM FIRESTORE
// ========================================

async function loadItems() {

    resultsContainer.innerHTML =
        "<p>Loading items...</p>";

    try {

        const querySnapshot =
            await getDocs(
                collection(db, "items")
            );

        allItems = [];

        querySnapshot.forEach((doc) => {

            allItems.push({
                id: doc.id,
                ...doc.data()
            });

        });

        console.log(
            "✅ Items loaded:",
            allItems
        );

        filterItems();

    } catch (error) {

        console.error(
            "❌ Error loading items:",
            error
        );

        resultsContainer.innerHTML =
            "<p>Failed to load items.</p>";
    }
}


// ========================================
// DISPLAY ITEMS
// ========================================

function displayItems(items) {

    resultsContainer.innerHTML = "";

    updateSearchMessage(items);

    if (items.length === 0) {

    resultsContainer.innerHTML = `
        <div class="no-results">

            <div class="no-results-icon">
                🔍
            </div>

            <h3>
                No items found
            </h3>

            <p>
                Try changing your search or filters.
            </p>

        </div>
    `;

    return;
}


    items.forEach((item) => {

        const card =
            document.createElement("div");

        card.className = "item-card";


        // ========================================
        // IMAGE
        // ========================================

        let imageHTML = "";

        if (item.imageURL) {

            imageHTML = `
                <div class="item-image">

                    <img
                        src="${escapeHTML(item.imageURL)}"
                        alt="${escapeHTML(
                            item.itemName || "Item"
                        )}"
                    >

                </div>
            `;

        } else {

            imageHTML = `
                <div class="item-image">

                    <div class="no-image">
                        No Image
                    </div>

                </div>
            `;
        }


        // ========================================
        // CARD
        // ========================================

        card.innerHTML = `

            ${imageHTML}

            <div class="item-card-content">

                <span class="item-type ${item.type || ""}">
                    ${capitalize(
                        item.type || "unknown"
                    )}
                </span>
                ${
                    (item.status || "active").toLowerCase() === "resolved"
                        ? `<span class="item-status resolved">${typeof t === "function" ? t("resolved", "Resolved") : "Resolved"}</span>`
                        : ""
                }

                <h3>
                    ${escapeHTML(
                        item.itemName ||
                        "Unnamed Item"
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        item.description || ""
                    )}
                </p>

                <p>
                    📍 ${escapeHTML(
                        item.location ||
                        "Unknown"
                    )}
                </p>

                <span class="category">
                    ${escapeHTML(
                        item.category ||
                        "Other"
                    )}
                </span>

            </div>
        `;


        // ========================================
        // CLICK CARD
        // ========================================

        card.addEventListener(
            "click",
            () => {

                localStorage.setItem(
                    "selectedItemId",
                    item.id
                );

                window.location.href =
                    "item-details.html";
            }
        );


        resultsContainer.appendChild(card);

    });
}

// ========================================
// SEARCH RESULT MESSAGE
// ========================================

function updateSearchMessage(items) {

    const message =
        document.getElementById("search-message");

    if (!message) {
        return;
    }


    if (items.length === 0) {

        message.textContent = t("No items found.", "No items found.");

        return;
    }


    if (items.length === 1) {

        message.textContent = t("1 item found.", "1 item found.");

        return;
    }


    message.textContent = getLanguage() === "th"
        ? `${items.length} รายการ`
        : `${items.length} items found.`;
}


// ========================================
// FILTER ITEMS
// ========================================

function filterItems() {

    const searchText =
        searchInput.value
            .toLowerCase()
            .trim();


    const category =
        categoryFilter.value
            .toLowerCase();


    const type =
        typeFilter
            ? typeFilter.value.toLowerCase()
            : "all";


    const status =
        statusFilter
            ? statusFilter.value.toLowerCase()
            : "all";


    const location =
        locationFilter.value
            .toLowerCase();


    console.log("Searching:", {
        searchText,
        category,
        type,
        status,
        location
    });


    const filtered =
        allItems.filter((item) => {

            const itemName =
                (item.itemName || "")
                    .toLowerCase();


            const description =
                (item.description || "")
                    .toLowerCase();


            const itemCategory =
                (item.category || "")
                    .toLowerCase();


            const itemType =
                (item.type || "")
                    .toLowerCase();


            const itemStatus =
                (item.status || "active")
                    .toLowerCase();


            const itemLocation =
                (item.location || "")
                    .toLowerCase();


            // ========================================
            // SEARCH
            // ========================================

            const matchesSearch =
                !searchText ||
                itemName.includes(searchText) ||
                description.includes(searchText);


            // ========================================
            // CATEGORY
            // ========================================

            const matchesCategory =
                category === "all" ||
                itemCategory === category;


            // ========================================
            // TYPE
            // ========================================

            const matchesType =
                type === "all" ||
                itemType === type;


            // ========================================
            // STATUS
            // ========================================

            const matchesStatus =
                status === "all" ||
                itemStatus === status;


            // ========================================
            // LOCATION
            // ========================================

            const matchesLocation =
                location === "all" ||
                itemLocation === location;


            return (
                matchesSearch &&
                matchesCategory &&
                matchesType &&
                matchesStatus &&
                matchesLocation
            );

        });


    console.log(
        "Filtered items:",
        filtered
    );


    displayItems(filtered);


    // // ========================================
    // // MESSAGE
    // // ========================================

    // if (searchMessage) {

    //     if (filtered.length === 0) {

    //         searchMessage.textContent =
    //             "No matching items found.";

    //     } else {

    //         searchMessage.textContent =
    //             `${filtered.length} item(s) found.`;
    //     }
    // }
}


// ========================================
// SEARCH BUTTON
// ========================================

searchButton.addEventListener(
    "click",
    filterItems
);

// ========================================
// SEARCH WHILE TYPING
// ========================================

searchInput.addEventListener(
    "input",
    filterItems
);


// ========================================
// ENTER KEY
// ========================================

searchInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            filterItems();
        }

    }
);


// ========================================
// CATEGORY FILTER
// ========================================

categoryFilter.addEventListener(
    "change",
    filterItems
);


// ========================================
// TYPE FILTER
// ========================================

if (typeFilter) {
    typeFilter.addEventListener(
        "change",
        filterItems
    );
}


// ========================================
// STATUS FILTER
// ========================================

if (statusFilter) {
    statusFilter.addEventListener(
        "change",
        filterItems
    );
}


// ========================================
// LOCATION FILTER
// ========================================

locationFilter.addEventListener(
    "change",
    filterItems
);


// ========================================
// HELPER: CAPITALIZE
// ========================================

function capitalize(text) {

    if (!text) return "";

    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );
}


// ========================================
// HELPER: ESCAPE HTML
// ========================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// ========================================
// URL PARAMETERS
// ========================================

function applyURLFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get("category");

    if (categoryParam && categoryFilter) {
        const matchingOption = Array.from(categoryFilter.options).find(
            (opt) => opt.value.toLowerCase() === categoryParam.toLowerCase()
        );
        if (matchingOption) {
            categoryFilter.value = matchingOption.value;
        }
    }
}

window.addEventListener("popstate", () => {
    applyURLFilters();
    filterItems();
});

// ========================================
// START
// ========================================

applyURLFilters();
loadItems();