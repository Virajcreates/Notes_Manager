import { useState, useMemo } from 'react';
import { useNotes } from '@/hooks/useNotes';
import type { Note, NoteFormData } from '@/types/note';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Plus, Edit2, Trash2, FileText, Clock, Calendar, Tag } from 'lucide-react';
import { format } from '@/lib/utils';

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Educational: { bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-500/20' },
  Business:    { bg: 'bg-purple-500/10', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-500/20' },
  Personal:    { bg: 'bg-green-500/10', text: 'text-green-700 dark:text-green-400', border: 'border-green-500/20' },
  Technology:  { bg: 'bg-orange-500/10', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-500/20' },
  Finance:     { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500/20' },
  Health:      { bg: 'bg-red-500/10', text: 'text-red-700 dark:text-red-400', border: 'border-red-500/20' },
  Travel:      { bg: 'bg-teal-500/10', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-500/20' },
  General:     { bg: 'bg-gray-500/10', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-500/20' },
};

function CategoryBadge({ category, className = '' }: { category: string; className?: string }) {
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.General;
  return (
    <Badge
      variant="outline"
      className={`${style.bg} ${style.text} ${style.border} text-[11px] font-medium ${className}`}
    >
      {category}
    </Badge>
  );
}

function NoteForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initialData?: NoteFormData;
  onSubmit: (data: NoteFormData) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [category, setCategory] = useState(initialData?.category || 'Auto');
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; content?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({ title, content, category });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Title</label>
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          placeholder="Enter note title..."
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Category</label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Auto">✨ Auto-detect</SelectItem>
            {Object.keys(CATEGORY_STYLES).map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Content</label>
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (errors.content) setErrors((prev) => ({ ...prev, content: undefined }));
          }}
          placeholder="Enter note content..."
          rows={6}
          className={errors.content ? 'border-red-500 resize-none' : 'resize-none'}
        />
        {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
      </div>
      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </DialogFooter>
    </form>
  );
}

function NoteCard({
  note,
  onEdit,
  onDelete,
  onView,
}: {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  onView: (note: Note) => void;
}) {
  return (
    <Card
      className="group hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/30 cursor-pointer"
      onClick={() => onView(note)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="mb-1.5">
              <CategoryBadge category={note.category} />
            </div>
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {note.title}
            </h3>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onEdit(note); }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(note); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm line-clamp-4 whitespace-pre-wrap mb-4">
          {note.content}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{format(note.createdAt, 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{format(note.createdAt, 'h:mm a')}</span>
          </div>
          {note.updatedAt !== note.createdAt && (
            <div className="flex items-center gap-1 text-primary/70">
              <Edit2 className="h-3 w-3" />
              <span>Edited {format(note.updatedAt, 'MMM d, h:mm a')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <FileText className="h-10 w-10 text-primary/60" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No notes yet</h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        Start creating notes to keep track of your ideas, tasks, and important information.
      </p>
      <Button onClick={onCreate} className="gap-2">
        <Plus className="h-4 w-4" />
        Create your first note
      </Button>
    </div>
  );
}

function SearchEmptyState({ searchQuery, onClear }: { searchQuery: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <Search className="h-10 w-10 text-muted-foreground/60" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No notes found</h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        No notes match &quot;<span className="font-medium">{searchQuery}</span>&quot;. Try a different search term.
      </p>
      <Button variant="outline" onClick={onClear}>
        Clear search
      </Button>
    </div>
  );
}

export default function App() {
  const { notes, isLoaded, createNote, updateNote, deleteNote, searchNotes } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  const availableCategories = useMemo(() => {
    const cats = new Set(notes.map(n => n.category));
    return Array.from(cats).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let result = searchNotes(searchQuery);
    if (selectedCategory) {
      result = result.filter(n => n.category === selectedCategory);
    }
    return result;
  }, [searchQuery, searchNotes, selectedCategory]);

  const handleCreate = async (data: NoteFormData) => {
    await createNote(data);
    setIsCreateDialogOpen(false);
  };

  const handleUpdate = async (data: NoteFormData) => {
    if (editingNote) {
      await updateNote(editingNote.id, data);
      setEditingNote(null);
    }
  };

  const handleDelete = async () => {
    if (deletingNote) {
      await deleteNote(deletingNote.id);
      setDeletingNote(null);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Notes Manager</h1>
                <p className="text-xs text-muted-foreground">
                  {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes..."
                  className="pl-9 pr-9"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <span className="sr-only">Clear search</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2 shrink-0">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Note</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Category Filter Bar */}
      {availableCategories.length > 0 && (
        <div className="border-b bg-background/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === null
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                All
              </button>
              {availableCategories.map((cat) => {
                const style = CATEGORY_STYLES[cat] || CATEGORY_STYLES.General;
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(isActive ? null : cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                      isActive
                        ? `${style.bg} ${style.text} ${style.border} shadow-sm ring-1 ring-current/20`
                        : `${style.bg} ${style.text} ${style.border} opacity-70 hover:opacity-100`
                    }`}
                  >
                    {cat}
                    <span className="ml-1 opacity-60">
                      ({notes.filter(n => n.category === cat).length})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notes.length === 0 ? (
          <EmptyState onCreate={() => setIsCreateDialogOpen(true)} />
        ) : filteredNotes.length === 0 ? (
          <SearchEmptyState searchQuery={searchQuery} onClear={clearSearch} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={setEditingNote}
                onDelete={setDeletingNote}
                onView={setViewingNote}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
            <DialogDescription>
              Add a new note with a title and content.
            </DialogDescription>
          </DialogHeader>
          <NoteForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            submitLabel="Create Note"
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>Make changes to your note.</DialogDescription>
          </DialogHeader>
          {editingNote && (
            <NoteForm
              initialData={{ 
                title: editingNote.title, 
                content: editingNote.content,
                category: editingNote.category 
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditingNote(null)}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Note Dialog */}
      <Dialog open={!!viewingNote} onOpenChange={() => setViewingNote(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="mb-2">
              {viewingNote && <CategoryBadge category={viewingNote.category} />}
            </div>
            <DialogTitle className="text-xl pr-6">{viewingNote?.title}</DialogTitle>
            <DialogDescription asChild>
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Created {viewingNote ? format(viewingNote.createdAt, 'MMM d, yyyy') : ''}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{viewingNote ? format(viewingNote.createdAt, 'h:mm a') : ''}</span>
                </div>
                {viewingNote && viewingNote.updatedAt !== viewingNote.createdAt && (
                  <div className="flex items-center gap-1">
                    <Edit2 className="h-3 w-3" />
                    <span>Edited {format(viewingNote.updatedAt, 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4">
            <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
              {viewingNote?.content}
            </p>
          </div>
          <DialogFooter className="gap-2 pt-4 border-t">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                if (viewingNote) {
                  setViewingNote(null);
                  setEditingNote(viewingNote);
                }
              }}
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => setViewingNote(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingNote} onOpenChange={() => setDeletingNote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;<span className="font-medium">{deletingNote?.title}</span>&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
