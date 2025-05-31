# Wordle Word Scraper

A Node.js application that scrapes and stores Wordle words from the New York Times API, starting from June 19, 2021. The script automatically updates every 24 hours to fetch the latest word.

## Features

- Fetches historical Wordle words since June 19, 2021
- Automatically updates daily to get the new word
- Stores words in a JSON file with their corresponding dates
- Shows a live countdown timer until the next word check
- Handles errors gracefully and avoids duplicate entries

## Prerequisites

- Node.js (version 12.20.0 or higher)
- npm (Node Package Manager)

## Installation

1. Clone this repository or download the source code
2. Navigate to the project directory
3. Install dependencies:
```bash
npm install
```

## Usage

To start the scraper:
```bash
npm start
```

The script will:
1. First fetch all historical words since June 19, 2021
2. Check for today's word
3. Display a countdown timer until the next check (24 hours)
4. Automatically update the `wordle-words.json` file with new words

## Output Format

The words are stored in `wordle-words.json` with the following structure:
```json
{
  "words": [
    {
      "date": "YYYY-MM-DD",
      "solution": "WORD"
    },
    ...
  ]
}
```

## Dependencies

- `node-fetch`: For making HTTP requests to the NYT API
- `moment`: For date handling and formatting
- `moment-timezone`: For timezone support

## Notes

- The script checks for new words every 24 hours (1440 minutes)
- Words are fetched from the official New York Times Wordle API
- The script maintains a persistent JSON file to store all fetched words
- Duplicate entries are automatically prevented

## Error Handling

- Network errors are handled gracefully
- Failed requests will be retried on the next check
- The script continues running even if individual requests fail

## License

ISC 