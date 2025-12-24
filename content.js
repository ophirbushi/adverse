// A simple list of patterns that usually mean "ADVERTISEMENT"
const commonAdSelectors = [
    'iframe[src*="google"]',
    'iframe[src*="doubleclick"]',
    'div[id*="google_ads"]',
    'div[class*="ad-container"]',
    'div[class*="ad_wrapper"]',
    'aside[class*="ad"]',
    '.adsbygoogle'
];

// Keep a history of the last 10 verses shown to avoid immediate repeats
let verseHistory = [];

let theverse;

function getRandomVerse() {
    if (theverse) {
        return theverse;
    }

    let verse;
    let attempts = 0;

    // Try to find a verse that hasn't been shown recently
    do {
        verse = VERSES_DB[Math.floor(Math.random() * VERSES_DB.length)];
        attempts++;
    } while (verseHistory.includes(verse.ref) && attempts < 10);

    // Update history
    verseHistory.push(verse.ref);
    if (verseHistory.length > 15) {
        verseHistory.shift(); // Remove the oldest one
    }

    theverse = verse;
    return verse;
}

function replaceAd(element) {
    // 1. Safety Check: Don't replace something we already fixed
    if (element.getAttribute('data-scripture-replaced')) return;

    // 2. Measure the Ad (So we don't break the layout)
    const width = element.offsetWidth;
    const height = element.offsetHeight;

    // 3. Filter: Skip invisible or tiny 1x1 tracking pixels
    if (width < 50 || height < 50) return;
    if (element.style.display === 'none') return;

    // 4. Mark as replaced immediately to prevent loops
    element.setAttribute('data-scripture-replaced', 'true');

    // 5. Create the Verse Element
    const verse = getRandomVerse();
    const container = document.createElement('div');
    container.className = 'scripture-replacement-box';

    // Match dimensions
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;

    // Dynamic Font Sizing (Simple Math)
    // Smaller box = smaller text. 
    let fontSize = Math.min(width, height) / 8;
    fontSize = Math.max(12, Math.min(fontSize, 24)); // Clamp between 12px and 24px
    container.style.fontSize = `${fontSize}px`;

    container.innerHTML = `
        <div class="scripture-text">"${verse.text}"</div>
        <div class="scripture-ref">${verse.ref}</div>
    `;

    // 6. The Swap
    // We insert the verse BEFORE the ad, then hide the ad.
    // This is safer than deleting the ad, which sometimes crashes scripts.
    if (element.parentNode) {
        element.parentNode.insertBefore(container, element);
        element.style.display = 'none';
        console.log("Ad Replaced with: " + verse.ref);
    }
}

function scanAndReplace() {
    commonAdSelectors.forEach(selector => {
        const ads = document.querySelectorAll(selector);
        ads.forEach(replaceAd);
    });
}

// --- EXECUTION START ---

// 1. Run immediately on load
scanAndReplace();

// 2. Run continuously for infinite scrolling sites
// (The MutationObserver is the modern, efficient way to do this)
const observer = new MutationObserver((mutations) => {
    // We don't need to check *what* changed, just run the scan.
    // Throttled slightly to save CPU.
    scanAndReplace();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});