import fetch from 'node-fetch';
import moment from 'moment-timezone';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORDS_FILE = path.join(__dirname, 'wordle-words.json');
const START_DATE = '2021-06-19';
const CHECK_INTERVAL = 1440 * 60 * 1000; // 1440 minutes in milliseconds

// Function to format time remaining
function formatTimeRemaining(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes} minutes and ${seconds} seconds`;
}

// Function to update countdown display
function startCountdown(nextCheckTime) {
    const updateCountdown = () => {
        const now = Date.now();
        const timeRemaining = nextCheckTime - now;
        
        if (timeRemaining <= 0) {
            return;
        }

        // Clear the previous line
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(`Next check in: ${formatTimeRemaining(timeRemaining)}`);
    };

    // Update every second
    const countdownInterval = setInterval(updateCountdown, 1000);
    updateCountdown(); // Initial display

    // Return the interval ID so we can clear it later
    return countdownInterval;
}

async function fetchWordleWord(date) {
    const formattedDate = date.format('YYYY-MM-DD');
    const url = `https://www.nytimes.com/svc/wordle/v2/${formattedDate}.json`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return {
            date: formattedDate,
            solution: data.solution,
        };
    } catch (error) {
        console.error(`Failed to fetch word for ${formattedDate}:`, error.message);
        return null;
    }
}

async function loadExistingWords() {
    try {
        const data = await fs.readFile(WORDS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return { words: [] };
    }
}

async function updateWordleWords() {
    console.log('Starting Wordle word update...');
    
    // Load existing words
    const wordleData = await loadExistingWords();
    const existingWords = new Set(wordleData.words.map(w => w.date));
    
    // Calculate date range
    const startDate = moment(START_DATE);
    const today = moment();
    const dates = [];
    
    // Generate all dates from start to today
    let currentDate = startDate.clone();
    while (currentDate.isSameOrBefore(today)) {
        if (!existingWords.has(currentDate.format('YYYY-MM-DD'))) {
            dates.push(currentDate.clone());
        }
        currentDate.add(1, 'day');
    }
    
    // Fetch new words
    const newWords = [];
    for (const date of dates) {
        const wordData = await fetchWordleWord(date);
        if (wordData) {
            newWords.push(wordData);
            console.log(`Fetched word for ${wordData.date}: ${wordData.solution}`);
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Combine existing and new words, sort by date
    wordleData.words = [...wordleData.words, ...newWords]
        .sort((a, b) => moment(a.date).diff(moment(b.date)));
    
    // Save updated words
    await fs.writeFile(WORDS_FILE, JSON.stringify(wordleData, null, 2));
    console.log('Words updated successfully!');
}

async function fetchTodaysWord() {
    console.log(`\nChecking for word on ${moment().format('YYYY-MM-DD')}...`);

    const wordleData = await loadExistingWords();
    const today = moment().format('YYYY-MM-DD');
    
    // Check if we already have today's word
    if (wordleData.words.some(w => w.date === today)) {
        console.log('Today\'s word already fetched. Starting countdown for next check...');
        return;
    }

    const wordData = await fetchWordleWord(moment(today));
    if (wordData) {
        wordleData.words.push(wordData);
        wordleData.words.sort((a, b) => moment(a.date).diff(moment(b.date)));
        await fs.writeFile(WORDS_FILE, JSON.stringify(wordleData, null, 2));
        console.log(`Added new word for ${today}: ${wordData.solution}`);
    }
}

async function startPeriodicUpdates() {
    // First do the initial update to get all historical words
    await updateWordleWords();
    
    // Then check for today's word
    await fetchTodaysWord();

    let countdownInterval;

    // Function to perform check and reset countdown
    const performCheck = async () => {
        // Clear existing countdown if it exists
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        
        await fetchTodaysWord();
        
        // Start new countdown
        const nextCheckTime = Date.now() + CHECK_INTERVAL;
        countdownInterval = startCountdown(nextCheckTime);
    };

    // Schedule periodic updates every 1440 minutes
    setInterval(performCheck, CHECK_INTERVAL);
    
    // Start initial countdown
    const nextCheckTime = Date.now() + CHECK_INTERVAL;
    countdownInterval = startCountdown(nextCheckTime);
}

// Start the periodic update process
startPeriodicUpdates();

// Handle process termination
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    process.exit(0);
}); 