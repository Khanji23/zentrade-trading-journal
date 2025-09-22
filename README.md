# ZenTrade Trading Journal

A professional trading journal application built with HTML, CSS, JavaScript, and Node.js.

## Features

- **Dashboard**: Comprehensive trading overview with key metrics
- **Trade Journal**: Log and track individual trades
- **Strategy Management**: Organize and analyze trading strategies
- **Analytics**: Performance tracking with charts and statistics
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Khanji23/zentrade-trading-journal.git
cd zentrade-trading-journal
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to:
   - **Landing Page**: http://localhost:8000
   - **Dashboard**: http://localhost:8000/index.html

## Project Structure

```
├── index.html          # Main dashboard
├── landing.html        # Landing page
├── journal.html        # Trade journal
├── strategies.html     # Strategy management
├── new-trade.html      # Add new trade
├── new-strategy.html   # Add new strategy
├── trade-details.html  # Trade details view
├── pricing.html        # Pricing page
├── about.html          # About page
├── features.html       # Features page
├── contact.html        # Contact page
├── auth-modal.html     # Authentication modal
├── server.js           # Express server
├── package.json        # Dependencies
├── .env               # Environment variables
└── js/                # JavaScript files
    ├── auth.js        # Authentication manager
    └── ...            # Other JS files
```

## Usage

### Adding Trades

1. Navigate to the "New Trade" page
2. Fill in trade details:
   - Symbol/Instrument
   - Entry/Exit prices
   - Position size
   - Strategy used
   - Notes and observations
3. Save the trade

### Managing Strategies

1. Go to "Strategies" page
2. Create new trading strategies
3. Assign strategies to trades
4. Track performance by strategy

### Viewing Analytics

- **Dashboard**: Overview of all trading activity
- **Equity Curve**: Visual representation of account growth
- **Performance Metrics**: Win rate, profit factor, risk-reward ratios
- **Calendar View**: Daily P&L tracking

## Data Storage

This application uses browser localStorage for data persistence. All trades, strategies, and user data are stored locally in your browser.

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Charts**: Chart.js
- **Backend**: Node.js, Express.js
- **Security**: Helmet.js, CORS, Rate Limiting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue on GitHub.

---

**ZenTrade** - Professional Trading Journal