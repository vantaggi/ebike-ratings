require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const SerpApi = require("google-search-results-nodejs");

// --- CONFIGURATION ---
const DATA_FILE_PATH = './ebike-data.json';
const OUTPUT_FILE_PATH = './ebike-data.json'; // To avoid overwriting original data during development
const COMPONENT_CATEGORIES = ['motori', 'batterie', 'freni', 'sospensioni', 'trasmissioni'];
// Simple cache to avoid re-fetching the same URL within a single run
const urlCache = new Map();

// --- HELPER FUNCTIONS ---

// Regex to find scores like "8/10", "4.5/5", "95%", "Rating: 9.2"
const SCORE_PATTERNS = [
    { regex: /(?:rating|score|punteggio)[:\s]*?(\d{1,2}(?:[.,]\d{1,2})?)\s*\/\s*10/i, scale: 10 }, // 8/10 or 8.5/10
    { regex: /(?:rating|score|punteggio)[:\s]*?(\d(?:[.,]\d{1,2})?)\s*\/\s*5/i,     scale: 5 },  // 4/5 or 4.5/5
    { regex: /(\d{1,3})\s*%/i,                                                    scale: 100 }, // 95%
    { regex: /(\d{1,2}(?:[.,]\d{1,2})?)\s*out of\s*10/i,                             scale: 10 }  // 8.5 out of 10
];

/**
 * Reads and parses the JSON data file.
 * @returns {object} The parsed JSON data.
 */
function readDataFile() {
    try {
        const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`Error reading or parsing the data file at ${DATA_FILE_PATH}:`, error);
        process.exit(1); // Exit if the data file is not available
    }
}

/**
 * Fetches the HTML content of a given URL using axios.
 * Uses a simple in-memory cache to avoid redundant fetches.
 * @param {string} url The URL to fetch.
 * @returns {Promise<string|null>} The HTML content or null on error.
 */
async function getUrlContent(url) {
    if (urlCache.has(url)) {
        return urlCache.get(url);
    }
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        urlCache.set(url, response.data);
        return response.data;
    } catch (error) {
        console.warn(`Warning: Could not fetch content from ${url}. Status: ${error.response ? error.response.status : 'N/A'}`);
        urlCache.set(url, null); // Cache failures too
        return null;
    }
}

/**
 * Searches for a rating score within a block of text.
 * @param {string} text The text to search within.
 * @returns {number|null} A normalized score out of 10, or null if not found.
 */
function findAndNormalizeScore(text) {
    for (const { regex, scale } of SCORE_PATTERNS) {
        const match = text.match(regex);
        if (match && match[1]) {
            const score = parseFloat(match[1].replace(',', '.'));
            if (isNaN(score)) continue;

            // Normalize the score to a 1-10 scale
            if (scale === 5) {
                return Math.min(score * 2, 10);
            }
            if (scale === 100) {
                return Math.min(score / 10, 10);
            }
            return Math.min(score, 10); // Assumes /10 or a direct 1-10 score
        }
    }
    return null;
}

/**
 * Scrapes a given URL to find a rating.
 * @param {string} url The URL of the review page.
 * @returns {Promise<number|null>} The normalized rating score, or null.
 */
async function scrapeUrlForRating(url) {
    const html = await getUrlContent(url);
    if (!html) return null;

    const $ = cheerio.load(html);
    // Search in common elements that might contain a rating
    const searchAreas = ['body', '.rating', '.score', '.review-summary'];
    let foundScore = null;

    for (const area of searchAreas) {
        const textContent = $(area).text();
        if (textContent) {
            foundScore = findAndNormalizeScore(textContent);
            if (foundScore !== null) {
                console.log(`  - Found score ${foundScore.toFixed(1)}/10 on ${url}`);
                return foundScore;
            }
        }
    }
    return null;
}

/**
 * Perform a Google search to find reviews for a given item.
 * @param {string} query The search query.
 * @returns {Promise<string[]>} A list of relevant URLs.
 */
function searchForReviews(query) {
    return new Promise((resolve, reject) => {
        console.log(`  - Searching Google for: "${query}"`);
        const search = new SerpApi.GoogleSearch(process.env.SERPAPI_API_KEY);
        const params = {
            q: query,
            engine: "google"
        };

        search.json(params, (data) => {
            if (data && data.organic_results) {
                resolve(data.organic_results.slice(0, 5).map(result => result.link));
            } else {
                console.error(`  - Google Search failed for "${query}":`, data.error);
                resolve([]);
            }
        });
    });
}


// --- MAIN LOGIC ---

async function main() {
    console.log("Starting the data aggregation process...");

    const allData = readDataFile();

    for (const category of COMPONENT_CATEGORIES) {
        const itemsToProcess = allData[category];

        if (!itemsToProcess) {
            console.warn(`Warning: Category "${category}" not found in the data file. Skipping.`);
            continue;
        }

        console.log(`\n--- Processing category: ${category.toUpperCase()} ---`);
        console.log(`Found ${itemsToProcess.length} items.`);

        for (const item of itemsToProcess) {
        const itemName = `${item.marca} ${item.modello}`;
        console.log(`\nProcessing: ${itemName} (ID: ${item.id})`);

        // Skip if a rating already exists and is valid
        if (item.valutazione !== null && item.valutazione > 0) {
            console.log(`  - Skipping, rating already exists: ${item.valutazione}`);
            continue;
        }

        const searchQuery = `${itemName} review`;
        const reviewUrls = await searchForReviews(searchQuery);

        if (reviewUrls.length === 0) {
            console.log("  - No relevant review URLs found from search.");
            item.valutazione = "N/A";
            continue;
        }

        const ratings = [];
        // Limit to processing the top 3 URLs to be efficient
        for (const url of reviewUrls.slice(0, 3)) {
            const rating = await scrapeUrlForRating(url);
            if (rating !== null) {
                ratings.push(rating);
            }
        }

        if (ratings.length > 0) {
            const averageRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
            item.valutazione = parseFloat(averageRating.toFixed(1)); // Round to one decimal place
            console.log(`  - SUCCESS: Calculated average rating: ${item.valutazione}`);
        } else {
            item.valutazione = "N/A";
            console.log("  - FAILED: Could not find any ratings after checking URLs.");
        }
    }
    }

    // --- SAVE RESULTS ---
    try {
        fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify(allData, null, 2), 'utf8');
        console.log(`\nProcess complete. Updated data saved to: ${OUTPUT_FILE_PATH}`);
    } catch (error) {
        console.error("Error writing the output file:", error);
    }
}

// Execute the main function
main();
