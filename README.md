# Notes Manager

A modern, full-stack note-taking application designed for efficiency and organization. Features intelligent auto-categorization, manual overrides, and a clean, responsive UI.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🌟 Features

- **Smart Categorization**: 
  - Automatically categorizes notes based on content using keyword analysis.
  - Supports 7 categories: *Business, Educational, Personal, Technology, Finance, Health, Travel*.
  - Manual override available for precise control.
- **Rich Text Editing**: Simple and effective text area for note content.
- **Search & Filter**: 
  - Instant search across title and content.
  - Filter notes by category with one click.
- **Responsive Design**: Built with Tailwind CSS for mobile-friendly layouts.
- **Persistent Storage**: Uses a local SQLite database for reliable data storage.

## 🛠️ Tech Stack

- **Frontend**: React (TypeScript), Vite, Tailwind CSS, Radix UI.
- **Backend**: Node.js, Express.js.
- **Database**: `sql.js` (SQLite) with local persistence.
- **Icons**: Lucide React.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Virajcreates/Notes_Manager.git
    cd Notes_Manager
    ```

### Development Mode
To run the frontend and backend separately with hot-reloading:

1.  **Start the Backend:**
    ```bash
    cd server
    npm install
    node index.js
    ```
    *Server runs on `http://localhost:3001`*

2.  **Start the Frontend:**
    ```bash
    # Open a new terminal
    cd app
    npm install
    npm run dev
    ```
    *App runs on `http://localhost:5173`*

### Production Mode
To run the application as a single deployable unit:

1.  **Build the Frontend:**
    ```bash
    cd app
    npm install
    npm run build
    ```

2.  **Run the Server:**
    ```bash
    cd ../server
    npm install
    node index.js
    ```
    *Access the full app at `http://localhost:3001`*

## 📂 Project Structure

```
Notes_Manager/
├── app/                 # React Frontend
│   ├── src/            # Source code
│   ├── dist/           # Production build artifacts
│   └── ...
├── server/              # Express Backend
│   ├── index.js        # Server entry point & API logic
│   ├── notes.db        # SQLite database file
│   └── ...
└── README.md
```

## 📝 API Endpoints

- `GET /api/notes`: Fetch all notes
- `POST /api/notes`: Create a new note
- `PUT /api/notes/:id`: Update a note
- `DELETE /api/notes/:id`: Delete a note
- `GET /api/categories`: Fetch available categories

---
Built with ❤️ by [Viraj](https://github.com/Virajcreates)
