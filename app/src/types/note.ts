export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: number;
  updatedAt: number;
}

export interface NoteFormData {
  title: string;
  content: string;
  category?: string;
}
