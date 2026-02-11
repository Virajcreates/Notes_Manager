const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'notes.db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../app/dist'))); // Serve frontend build

let db;

// ─── Categorization Engine ───────────────────────────────────────────────────

const CATEGORIES = {
    Educational: [
        'study', 'exam', 'course', 'lecture', 'homework', 'university', 'college',
        'school', 'research', 'learn', 'learning', 'student', 'teacher', 'professor',
        'assignment', 'thesis', 'dissertation', 'tutorial', 'education', 'class',
        'semester', 'grade', 'textbook', 'curriculum', 'syllabus', 'academic',
        'scholarship', 'diploma', 'degree', 'knowledge', 'training', 'workshop',
        'quiz', 'test', 'chapter', 'notes', 'reading', 'essay', 'paper',
    ],
    Business: [
        'meeting', 'client', 'revenue', 'project', 'deadline', 'strategy',
        'invoice', 'budget', 'stakeholder', 'presentation', 'proposal', 'contract',
        'negotiation', 'partnership', 'marketing', 'sales', 'profit', 'loss',
        'startup', 'entrepreneur', 'customer', 'vendor', 'supplier', 'logistics',
        'operations', 'management', 'leadership', 'team', 'corporate', 'office',
        'quarterly', 'kpi', 'roi', 'target', 'pipeline', 'deal', 'agenda',
        'milestone', 'deliverable', 'report', 'analytics', 'forecast',
    ],
    Personal: [
        'family', 'birthday', 'vacation', 'hobby', 'diary', 'goal', 'friend',
        'relationship', 'wedding', 'anniversary', 'party', 'weekend', 'home',
        'garden', 'cooking', 'recipe', 'pet', 'dog', 'cat', 'kids', 'children',
        'parent', 'mom', 'dad', 'shopping', 'gift', 'memory', 'dream', 'wish',
        'journal', 'gratitude', 'love', 'emotion', 'feeling', 'personal',
        'self-care', 'mindfulness', 'meditation', 'reflection',
    ],
    Technology: [
        'code', 'programming', 'software', 'api', 'server', 'database', 'bug',
        'deploy', 'frontend', 'backend', 'algorithm', 'javascript', 'python',
        'react', 'node', 'html', 'css', 'git', 'github', 'docker', 'cloud',
        'aws', 'azure', 'linux', 'windows', 'app', 'application', 'framework',
        'library', 'component', 'function', 'variable', 'debug', 'compile',
        'ai', 'machine learning', 'data science', 'cybersecurity', 'devops',
        'microservice', 'architecture', 'terminal', 'command', 'script',
        'automation', 'testing', 'ci/cd', 'agile', 'scrum', 'tech', 'computer',
    ],
    Finance: [
        'investment', 'savings', 'bank', 'tax', 'salary', 'expense', 'loan',
        'stock', 'mutual fund', 'portfolio', 'dividend', 'interest', 'mortgage',
        'insurance', 'retirement', 'pension', 'credit', 'debit', 'payment',
        'transaction', 'accounting', 'audit', 'balance', 'income', 'wealth',
        'crypto', 'bitcoin', 'trading', 'forex', 'bond', 'equity', 'asset',
        'liability', 'inflation', 'emi', 'finance', 'financial', 'money',
    ],
    Health: [
        'exercise', 'diet', 'workout', 'doctor', 'medicine', 'sleep', 'nutrition',
        'gym', 'yoga', 'running', 'fitness', 'weight', 'calories', 'protein',
        'vitamin', 'supplement', 'hospital', 'clinic', 'therapy', 'mental health',
        'anxiety', 'depression', 'wellness', 'hydration', 'water', 'walk',
        'stretching', 'cardio', 'strength', 'recovery', 'injury', 'prescription',
        'checkup', 'blood pressure', 'heart', 'health', 'healthy', 'disease',
    ],
    Travel: [
        'flight', 'hotel', 'trip', 'destination', 'passport', 'itinerary',
        'booking', 'tour', 'airport', 'luggage', 'sightseeing', 'beach',
        'mountain', 'camping', 'hiking', 'road trip', 'cruise', 'resort',
        'backpacking', 'visa', 'ticket', 'train', 'bus', 'adventure', 'explore',
        'travel', 'journey', 'abroad', 'international', 'domestic', 'tourism',
        'landmark', 'museum', 'culture', 'restaurant', 'street food',
    ],
};

/**
 * Categorize a note based on its title and content.
 * Scores each category by counting keyword matches (title keywords score 2x).
 * Returns the highest-scoring category, or 'General' if no keywords match.
 */
function categorize(title, content) {
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    const combined = titleLower + ' ' + contentLower;

    let bestCategory = 'General';
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(CATEGORIES)) {
        let score = 0;
        for (const keyword of keywords) {
            // Check if the keyword appears as a whole word or phrase
            const regex = new RegExp('\\b' + keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');

            const titleMatches = (titleLower.match(regex) || []).length;
            const contentMatches = (contentLower.match(regex) || []).length;

            // Title matches are weighted 2x
            score += titleMatches * 2 + contentMatches;
        }

        if (score > bestScore) {
            bestScore = score;
            bestCategory = category;
        }
    }

    return bestCategory;
}

// ─── Database ────────────────────────────────────────────────────────────────

// Save database to disk
function saveDb() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

async function initDb() {
    const SQL = await initSqlJs();

    // Load existing database file or create a new one
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    // Create notes table if it doesn't exist
    db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);

    // Migration: add category column if it doesn't exist (for existing DBs)
    try {
        const tableInfo = queryAll("PRAGMA table_info(notes)");
        const hasCategory = tableInfo.some(col => col.name === 'category');
        if (!hasCategory) {
            db.run("ALTER TABLE notes ADD COLUMN category TEXT NOT NULL DEFAULT 'General'");
            // Re-categorize all existing notes
            const existingNotes = queryAll('SELECT id, title, content FROM notes');
            for (const note of existingNotes) {
                const cat = categorize(note.title, note.content);
                db.run('UPDATE notes SET category = ? WHERE id = ?', [cat, note.id]);
            }
            console.log(`Migrated ${existingNotes.length} existing notes with categories.`);
        }
    } catch (e) {
        // Column might already exist, that's fine
    }

    saveDb();
}

// Helper: run a query and return rows as objects
function queryAll(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

function queryOne(sql, params = []) {
    const rows = queryAll(sql, params);
    return rows.length > 0 ? rows[0] : null;
}

// ─── API Routes ──────────────────────────────────────────────────────────────

// GET /api/notes - Fetch all notes
app.get('/api/notes', (req, res) => {
    try {
        const notes = queryAll('SELECT * FROM notes ORDER BY createdAt DESC');
        res.json(notes);
    } catch (error) {
        console.error('Failed to fetch notes:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// GET /api/notes/search?q=keyword - Search notes
app.get('/api/notes/search', (req, res) => {
    try {
        const keyword = req.query.q || '';
        const pattern = `%${keyword}%`;
        const notes = queryAll(
            'SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY createdAt DESC',
            [pattern, pattern]
        );
        res.json(notes);
    } catch (error) {
        console.error('Failed to search notes:', error);
        res.status(500).json({ error: 'Failed to search notes' });
    }
});

// GET /api/categories - Get all distinct categories in use
app.get('/api/categories', (req, res) => {
    try {
        const rows = queryAll('SELECT DISTINCT category FROM notes ORDER BY category');
        const categories = rows.map(r => r.category);
        res.json(categories);
    } catch (error) {
        console.error('Failed to fetch categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// POST /api/notes - Create a note
app.post('/api/notes', (req, res) => {
    try {
        const { title, content, category: manualCategory } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const id = crypto.randomUUID();
        const now = Date.now();
        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();

        let category = manualCategory;
        if (!category || category === 'Auto') {
            category = categorize(trimmedTitle, trimmedContent);
        }

        db.run(
            'INSERT INTO notes (id, title, content, category, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
            [id, trimmedTitle, trimmedContent, category, now, now]
        );
        saveDb();

        const note = { id, title: trimmedTitle, content: trimmedContent, category, createdAt: now, updatedAt: now };
        res.status(201).json(note);
    } catch (error) {
        console.error('Failed to create note:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// PUT /api/notes/:id - Update a note
app.put('/api/notes/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category: manualCategory } = req.body;

        const existing = queryOne('SELECT * FROM notes WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ error: 'Note not found' });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const now = Date.now();
        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();

        let category = manualCategory;
        if (!category || category === 'Auto') {
            // Only re-categorize if content changed significantly or user explicitly asked for Auto
            // But for simplicity, we always re-run auto-categorization if set to Auto
            category = categorize(trimmedTitle, trimmedContent);
        }

        db.run(
            'UPDATE notes SET title = ?, content = ?, category = ?, updatedAt = ? WHERE id = ?',
            [trimmedTitle, trimmedContent, category, now, id]
        );
        saveDb();

        const updatedNote = { ...existing, title: trimmedTitle, content: trimmedContent, category, updatedAt: now };
        res.json(updatedNote);
    } catch (error) {
        console.error('Failed to update note:', error);
        res.status(500).json({ error: 'Failed to update note' });
    }
});

// DELETE /api/notes/:id - Delete a note
app.delete('/api/notes/:id', (req, res) => {
    try {
        const { id } = req.params;

        const existing = queryOne('SELECT * FROM notes WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ error: 'Note not found' });
        }

        db.run('DELETE FROM notes WHERE id = ?', [id]);
        saveDb();

        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Failed to delete note:', error);
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

// Catch-all for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../app/dist/index.html'));
});

// Graceful shutdown
process.on('SIGINT', () => {
    if (db) {
        saveDb();
        db.close();
    }
    process.exit(0);
});

// Start server after DB init
initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Notes API server running on http://localhost:${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
