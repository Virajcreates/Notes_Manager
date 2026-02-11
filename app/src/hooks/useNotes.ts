import { useState, useEffect, useCallback } from 'react';
import type { Note, NoteFormData } from '@/types/note';

const API_BASE = '/api/notes';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch all notes from the API on mount
  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await fetch(API_BASE);
        if (!res.ok) throw new Error('Failed to fetch notes');
        const data = await res.json();
        setNotes(data);
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        setIsLoaded(true);
      }
    }
    fetchNotes();
  }, []);

  const createNote = useCallback(async (data: NoteFormData): Promise<Note | null> => {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create note');
      const newNote: Note = await res.json();
      setNotes((prev) => [newNote, ...prev]);
      return newNote;
    } catch (error) {
      console.error('Failed to create note:', error);
      return null;
    }
  }, []);

  const updateNote = useCallback(async (id: string, data: NoteFormData): Promise<Note | null> => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update note');
      const updatedNote: Note = await res.json();
      setNotes((prev) =>
        prev.map((note) => (note.id === id ? updatedNote : note))
      );
      return updatedNote;
    } catch (error) {
      console.error('Failed to update note:', error);
      return null;
    }
  }, []);

  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete note');
      setNotes((prev) => prev.filter((note) => note.id !== id));
      return true;
    } catch (error) {
      console.error('Failed to delete note:', error);
      return false;
    }
  }, []);

  const searchNotes = useCallback(
    (keyword: string): Note[] => {
      if (!keyword.trim()) return notes;
      const lowerKeyword = keyword.toLowerCase().trim();
      return notes.filter(
        (note) =>
          note.title.toLowerCase().includes(lowerKeyword) ||
          note.content.toLowerCase().includes(lowerKeyword)
      );
    },
    [notes]
  );

  const getNoteById = useCallback(
    (id: string): Note | undefined => {
      return notes.find((note) => note.id === id);
    },
    [notes]
  );

  return {
    notes,
    isLoaded,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    getNoteById,
  };
}
