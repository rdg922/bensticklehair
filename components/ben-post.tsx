"use client";

import {
  useState,
  useOptimistic,
  useActionState,
  startTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  dislikeBenPost,
  likeBenPost,
  addBenComment,
  deleteBenPost,
} from "@/lib/actions";

interface BenPostProps {
  ben: any;
  userLikes?: string[];
  currentUserId?: string;
}

export function BenPost({ ben, userLikes = [], currentUserId }: BenPostProps) {
  const router = useRouter();
  const [likes, setLikes] = useState(ben.ben_likes?.[0]?.count || 0);
  const [hasLiked, setHasLiked] = useState(userLikes.includes(ben.id));
  const [comments, setComments] = useState(ben.ben_comments || []);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isLiking, setIsLiking] = useState(false); // Add debouncing state
  const [commentState, commentAction, commentPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const content = formData.get("content") as string;
      const result = await addBenComment(ben.id, content);

      if (result.success) {
        // Optimistically update comments
        setComments((prev: any[]) => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            content,
            users: { name: "You" },
            created_at: new Date().toISOString(),
          },
        ]);

        // Reset form
        const form = document.querySelector(
          `form[data-ben-id="${ben.id}"]`
        ) as HTMLFormElement;
        if (form) {
          form.reset();
        }

        return { success: true };
      }

      return result;
    },
    null
  );

  const [optimisticLikes, updateOptimisticLikes] = useOptimistic(
    { count: likes, hasLiked },
    (state, action: "like" | "dislike") => {
      if (action === "like" && !state.hasLiked) {
        return { count: Math.max(0, state.count + 1), hasLiked: true };
      }
      if (action === "dislike" && state.hasLiked) {
        return { count: Math.max(0, state.count - 1), hasLiked: false };
      }
      return state;
    }
  );

  const handleLike = async () => {
    // Check if user is authenticated
    if (!currentUserId) {
      alert("Please sign in to like posts!");
      return;
    }

    // Prevent spam clicking
    if (isLiking) {
      return;
    }

    setIsLiking(true);

    const isCurrentlyLiked = optimisticLikes.hasLiked;
    const action = isCurrentlyLiked ? "dislike" : "like";

    // Optimistic update
    startTransition(() => {
      updateOptimisticLikes(action);
    });

    try {
      // Server call
      const result = isCurrentlyLiked
        ? await dislikeBenPost(ben.id)
        : await likeBenPost(ben.id);

      if (result.success) {
        // Update real state
        setLikes((prev: number) =>
          Math.max(0, isCurrentlyLiked ? prev - 1 : prev + 1)
        );
        setHasLiked(!isCurrentlyLiked);
      } else {
        // Revert optimistic update on error
        if (isCurrentlyLiked) {
          setLikes((prev) => Math.max(0, prev + 1));
          setHasLiked(true);
        } else {
          setLikes((prev) => Math.max(0, prev - 1));
          setHasLiked(false);
        }
      }
    } catch (error) {
      console.error("Error liking post:", error);
      // Revert optimistic update on error
      if (isCurrentlyLiked) {
        setLikes((prev) => Math.max(0, prev + 1));
        setHasLiked(true);
      } else {
        setLikes((prev) => Math.max(0, prev - 1));
        setHasLiked(false);
      }
    } finally {
      // Re-enable button after a short delay
      setTimeout(() => setIsLiking(false), 500);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this Ben post? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteBenPost(ben.id);

      if (result.success) {
        // Use router refresh instead of window.location.reload for better UX
        router.refresh();
      } else {
        alert(result.error || "Failed to delete post");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An unexpected error occurred while deleting the post");
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/ben/${ben.id}`;
      await navigator.clipboard.writeText(shareUrl);

      setIsShared(true);

      // Reset the text after 2 seconds
      setTimeout(() => {
        setIsShared(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Fallback for browsers that don't support clipboard API
      alert("Failed to copy link. Please copy the URL manually.");
    }
  };

  return (
    <div className="ben-post p-6">
      <div className="mb-4">
        <h3 className="text-2xl font-bold mb-2">{ben.name}</h3>
        <p className="text-lg">
          by <span className="glow-text">{ben.users?.name || "Anonymous"}</span>
        </p>
        <p className="text-sm opacity-80">
          {new Date(ben.created_at).toLocaleDateString()}
        </p>
      </div>

      {ben.image_data && (
        <div className="mb-4 text-center">
          <img
            src={ben.image_data || "/placeholder.svg"}
            alt={ben.name}
            className="border-4 border-white max-w-md w-full mx-auto shadow-lg"
          />
        </div>
      )}
      {ben.birthday_message && (
        <div className="my-3 p-3 bg-yellow-200 border-l-4 border-yellow-500 rounded">
          <p className="text-sm font-bold text-yellow-800 mb-1">
            🎂 BIRTHDAY MESSAGE:
          </p>
          <p className="text-sm text-yellow-900">{ben.birthday_message}</p>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={handleLike}
          disabled={isLiking || !currentUserId}
          className={`btn-3d px-4 py-2 text-lg ${
            optimisticLikes.hasLiked ? "btn-danger" : "btn-warning"
          } ${
            !currentUserId || isLiking ? "opacity-50 cursor-not-allowed" : ""
          }`}
          title={!currentUserId ? "Sign in to like posts" : ""}
        >
          {optimisticLikes.count} LIKES {isLiking ? "..." : ""}
        </button>

        <button
          onClick={handleShare}
          className="btn-3d btn-primary px-4 py-2 text-lg"
        >
          {isShared ? "COPIED LINK!" : "SHARE"}
        </button>

        {currentUserId === ben.user_id && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn-3d btn-danger px-4 py-2 text-lg"
          >
            {isDeleting ? "DELETING..." : "DELETE"}
          </button>
        )}
      </div>

      <div className="container-yellow p-4 w-full">
        <form
          action={commentAction}
          className="flex gap-2 mb-3"
          data-ben-id={ben.id}
        >
          <input
            type="text"
            name="content"
            placeholder="Add a comment"
            className="flex-1 p-2 text-sm"
            required
            disabled={commentPending}
          />
          <button
            type="submit"
            disabled={commentPending}
            className="btn-3d btn-primary px-3 py-2 text-sm"
          >
            {commentPending ? "POSTING..." : "POST"}
          </button>
        </form>

        {commentState && "error" in commentState && commentState.error && (
          <div className="text-red-500 mb-2">{commentState.error}</div>
        )}

        {comments.length > 0 && (
          <div className="space-y-2">
            {comments.slice(0, 3).map((comment: any) => (
              <div
                key={comment.id}
                className="bg-white p-2 border-l-4 border-purple-500"
              >
                <span className="font-bold text-purple-600">
                  {comment.users?.name || "Anonymous"}:
                </span>{" "}
                <span className="text-gray-800">{comment.content}</span>
              </div>
            ))}
            {comments.length > 3 && (
              <div className="text-center">
                <a
                  href={`/ben/${ben.id}`}
                  className="btn-3d btn-primary px-4 py-2 text-sm"
                >
                  View all {comments.length} comments
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
