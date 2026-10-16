# SpendWise — Personal Expense & Spending Insights

SpendWise is a responsive, browser-based expense tracker built with **HTML, CSS, and vanilla JavaScript**. It helps users record transactions, set a monthly budget, explore category-level spending, and export their records for further analysis.

## Features

- Responsive dashboard with spending, remaining budget, transaction count, and average expense metrics
- Create, edit, search, filter, and delete expenses
- Category breakdown donut chart and six-month spending trend chart drawn with the Canvas API
- Rule-based insights for budget status, top categories, and largest transactions
- Monthly budget setting
- CSV export for use in Excel, Python, Power BI, or other analytics tools
- Browser persistence using `localStorage`
- Input validation, accessible labels, empty states, and confirmation prompts
- Sample transactions so the dashboard is useful on first launch

## Tech stack

- HTML5: semantic page structure and forms
- CSS3: responsive layout, design system, and mobile navigation
- JavaScript (ES6+): state, validation, filtering, aggregation, chart drawing, and CSV generation
- Browser APIs: `localStorage`, Canvas, Blob, and URL

No framework, backend, build step, API key, or package installation is required. Google Fonts are loaded online; the app itself still works without them.

## Run locally

### Option 1 — Open the file
1. Download or unzip this repository.
2. Open `index.html` in a modern browser.
3. Start adding expenses.

### Option 2 — Use VS Code Live Server (recommended while developing)
1. Open the `spendwise` folder in VS Code.
2. Install the **Live Server** extension if needed.
3. Right-click `index.html` and select **Open with Live Server**.

A local address such as `http://127.0.0.1:5500` will open in your browser. A server is not strictly required, but Live Server automatically refreshes after edits.

## Project structure

```text
spendwise/
├── index.html          # Dashboard markup, transaction table, and modal form
├── css/
│   └── styles.css      # Visual system, responsive layouts, and components
├── js/
│   └── app.js          # Data model, rendering, charts, validation, CSV export
└── README.md           # Setup instructions and project documentation
```

## How the data works

- Transactions are JavaScript objects with an ID, name, amount, category, date, payment method, and optional notes.
- The app reads/writes transactions and budget values in browser `localStorage`.
- The dashboard calculates totals and category shares from the selected month's transaction list.
- Charts use the Canvas API, so no charting dependency is required.
- CSV export produces a downloadable file that can be analyzed with spreadsheets or Python.

**Privacy note:** Data is stored only in the current browser profile. It is not synced between devices and may be removed if browser site data is cleared. Export a CSV backup before clearing browser data.

## Suggested manual test checklist

- [ ] Add an expense with valid details and verify the metrics update.
- [ ] Try an empty name or a zero amount and confirm validation.
- [ ] Edit an existing transaction.
- [ ] Delete a transaction and cancel/confirm the prompt.
- [ ] Search by transaction name and filter by category.
- [ ] Change the month selector.
- [ ] Set a budget lower than the month's expenses and verify the warning insight.
- [ ] Export CSV and open it in a spreadsheet.
- [ ] Refresh the page and verify the saved transactions remain.
- [ ] Resize the browser to mobile width.

## Future improvements

1. Add a backend and authentication so data can sync across devices.
2. Add recurring expenses and income tracking.
3. Add month-over-month percentage comparisons.
4. Add unit tests for aggregation and validation logic.
5. Add a Python analysis notebook to explore exported transactions.
6. Add automated deployment using GitHub Pages.

## Resume-ready project description

**SpendWise — Personal Expense & Spending Insights** | HTML, CSS, JavaScript, Canvas API, localStorage

Built a responsive expense-tracking web app with CRUD operations, category and date filters, interactive spending charts, budget monitoring, rule-based insights, and CSV export. Implemented client-side validation and browser persistence using vanilla JavaScript and localStorage.

> Keep the description aligned with the features you have tested and understand. The insights are rule-based analytics, not a trained machine-learning model.
