import * as React from "react";
import { useFetcher } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  ValidationMessage,
} from "~/components/ui";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  MessageSquare,
  Tag,
  Trash2,
} from "lucide-react";
import type { QuickNote, User } from "~/db/schema";
import { RelativeDate } from "~/components/ui";

interface QuickNotesProps {
  householdId: string;
  memberId: string;
  member: User;
  notes: QuickNote[];
  onNoteCreated?: (note: QuickNote) => void;
  onNoteDeleted?: (noteId: number) => void;
}

export const QuickNotes: React.FC<QuickNotesProps> = ({
  householdId,
  memberId,
  member,
  notes,
  onNoteCreated,
  onNoteDeleted,
}) => {
  const fetcher = useFetcher();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [noteContent, setNoteContent] = React.useState("");
  const [noteTags, setNoteTags] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isCreating = fetcher.state === "submitting";

  // Handle successful note creation
  React.useEffect(() => {
    if (fetcher.data?.success && fetcher.data.note) {
      setNoteContent("");
      setNoteTags("");
      setIsExpanded(false);
      onNoteCreated?.(fetcher.data.note);
    }
  }, [fetcher.data, onNoteCreated]);

  // Handle successful note deletion
  React.useEffect(() => {
    if (fetcher.data?.success && fetcher.data.deletedNoteId) {
      onNoteDeleted?.(fetcher.data.deletedNoteId);
    }
  }, [fetcher.data, onNoteDeleted]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("_action", "create");
    formData.append("content", noteContent.trim());
    formData.append("tags", noteTags.trim());
    formData.append("householdId", householdId);
    formData.append("memberId", memberId);

    fetcher.submit(formData, {
      method: "post",
    });
  };

  const handleDelete = (noteId: number) => {
    if (confirm("Are you sure you want to delete this quick note?")) {
      const formData = new FormData();
      formData.append("_action", "delete");
      formData.append("noteId", noteId.toString());

      fetcher.submit(formData, {
        method: "post",
      });
    }
  };

  const noteCount = notes.length;
  const hasNotes = noteCount > 0;

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Quick Notes
            </CardTitle>
            <CardDescription className="text-slate-400">
              Rapid notes for {member.name} - {noteCount} note
              {noteCount !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Add Note
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Note Form */}
        {isExpanded && (
          <fetcher.Form
            onSubmit={handleSubmit}
            className="space-y-4 p-4 bg-slate-800/50 border border-slate-600 rounded-lg"
          >
            {/* Error Display */}
            {fetcher.data?.error && (
              <ValidationMessage type="error" message={fetcher.data.error} />
            )}

            {/* Success Message */}
            {fetcher.data?.success && (
              <ValidationMessage
                type="success"
                message="Quick note created successfully!"
              />
            )}

            {/* Note Content */}
            <div className="space-y-2">
              <Label
                htmlFor="noteContent"
                className="text-sm font-medium text-slate-200"
              >
                Note <span className="text-red-400">*</span>
              </Label>
              <Input
                id="noteContent"
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                placeholder="Enter your quick note here..."
                className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-400"
                required
                maxLength={500}
              />
              <div className="text-xs text-slate-400 text-right">
                {noteContent.length}/500
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label
                htmlFor="noteTags"
                className="text-sm font-medium text-slate-200"
              >
                Tags
              </Label>
              <Input
                id="noteTags"
                value={noteTags}
                onChange={e => setNoteTags(e.target.value)}
                placeholder="Enter tags separated by commas (optional)"
                className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder-slate-400"
                maxLength={100}
              />
              <div className="text-xs text-slate-400 text-right">
                {noteTags.length}/100
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isCreating || !noteContent.trim()}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Note
                  </>
                )}
              </Button>
            </div>
          </fetcher.Form>
        )}

        {/* Existing Notes */}
        {hasNotes && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300 border-b border-slate-600 pb-2">
              Recent Notes
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notes.map(note => (
                <div
                  key={note.id}
                  className="p-3 bg-slate-800/50 border border-slate-600 rounded-lg hover:border-slate-500 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm mb-2 leading-relaxed">
                        {note.content}
                      </p>

                      {/* Tags */}
                      {note.tags && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {note.tags
                            .split(",")
                            .slice(0, 3)
                            .map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full border border-slate-600 flex items-center gap-1"
                              >
                                <Tag className="w-3 h-3" />
                                {tag.trim()}
                              </span>
                            ))}
                          {note.tags.split(",").length > 3 && (
                            <span className="px-2 py-1 bg-slate-700/30 text-slate-500 text-xs rounded-full border border-slate-600">
                              +{note.tags.split(",").length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Created Date */}
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <span>Created:</span>
                        <RelativeDate
                          date={note.createdAt}
                          className="text-slate-300 font-medium"
                        />
                      </div>
                    </div>

                    {/* Delete Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(note.id)}
                      disabled={isCreating}
                      className="border-red-600 text-red-400 hover:bg-red-900/20 h-8 px-3 flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasNotes && !isExpanded && (
          <div className="text-center py-6 text-slate-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              No quick notes yet. Click "Add Note" to get started.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
