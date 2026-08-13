"use client";

import React, { useState } from "react";
import { Lock, Send, Trash2, User, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export interface NoteItem {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export function InternalNotesSection({
  ticketId,
  initialNotes = [],
}: {
  ticketId: string;
  initialNotes?: NoteItem[];
}) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    async function loadNotes() {
      try {
        const res = await api.get(`/tickets/${ticketId}/notes`);
        if (Array.isArray(res.data)) {
          const mapped = res.data.map((n: any) => ({
            id: n.id,
            author_name: n.author_name || "Unknown",
            content: n.content,
            created_at: new Date(n.created_at).toLocaleString(),
          }));
          setNotes(mapped);
        }
      } catch (err) {
        console.warn("Failed to load notes", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadNotes();
  }, [ticketId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await api.post(`/tickets/${ticketId}/notes`, {
        content: newNoteContent.trim(),
      });
      const newNote: NoteItem = {
        id: res.data.id,
        author_name: res.data.author_name || user?.full_name || "You",
        content: res.data.content,
        created_at: new Date(res.data.created_at).toLocaleString(),
      };
      setNotes((prev) => [...prev, newNote]);
      setNewNoteContent("");
    } catch (err) {
      console.error("Failed to add note", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await api.delete(`/tickets/notes/${noteId}`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      console.error("Failed to delete note", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Notice Banner */}
      <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800">
        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Internal notes are private and never visible to the customer.</span>
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {notes.map((note) => (
          <div
            key={note.id}
            className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl text-xs space-y-1.5"
          >
            <div className="flex items-center justify-between text-slate-500">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                  {note.author_name.charAt(0).toUpperCase()}
                </div>
                <span>{note.author_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">{note.created_at}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            <p className="text-slate-700 leading-relaxed pl-6">{note.content}</p>
          </div>
        ))}
      </div>

      {/* Add Note Form */}
      <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-slate-100">
        <textarea
          rows={3}
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          placeholder="Write a private note for your team..."
          className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition shadow-2xs"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!newNoteContent.trim() || isSubmitting}
            className="px-4 py-2 bg-slate-950 hover:bg-black text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Add Private Note</span>
          </button>
        </div>
      </form>
    </div>
  );
}
