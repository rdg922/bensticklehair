"use client";

import {
  useState,
  useOptimistic,
  useActionState,
  startTransition,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import {
  dislikeBenPost,
  likeBenPost,
  addBenComment,
  deleteBenPost,
} from "@/lib/actions";
import { createClient } from "@/lib/supabase-client";

interface BenDetailViewProps {
  ben: any;
  userLikes?: string[];
  currentUserId?: string;
}

interface Comment {
  id: string;
  content: string;
  users: { name: string };
  created_at: string;
}

export function BenDetailView({
  ben,
  userLikes = [],
  currentUserId,
}: BenDetailViewProps) {
  const router = useRouter();
  const [likes, setLikes] = useState(ben.ben_likes?.[0]?.count || 0);
  const [hasLiked, setHasLiked] = useState(userLikes.includes(ben.id));
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false); // Add debouncing state
  const observerRef = useRef<HTMLDivElement>(null);

  const [commentState, commentAction, commentPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const content = formData.get("content") as string;
      const result = await addBenComment(ben.id, content);

      if (result.success) {
        // Add new comment to the top of the list
        const newComment = {
          id: `temp-${Date.now()}`,
          content,
          users: { name: "You" },
          created_at: new Date().toISOString(),
        };
        setComments((prev) => [newComment, ...prev]);

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

  const loadComments = useCallback(
    async (pageNum: number) => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("ben_comments")
          .select(
            `
            id,
            content,
            created_at,
            users:user_id(name)
          `
          )
          .eq("ben_id", ben.id)
          .order("created_at", { ascending: true })
          .range(pageNum * 10, pageNum * 10 + 9);

        if (error) {
          console.error("Error loading comments:", error);
          return;
        }

        if (data && data.length > 0) {
          setComments((prev) => [...prev, ...data]);
          if (data.length < 10) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error("Error loading comments:", error);
      } finally {
        setLoading(false);
      }
    },
    [ben.id]
  );

  useEffect(() => {
    loadComments(0);
  }, [loadComments]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setLoading(true);
          const nextPage = page + 1;
          setPage(nextPage);
          loadComments(nextPage);
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, page, loadComments]);

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
        // Redirect to home page after successful deletion
        router.push("/");
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

  return (
    <div className="ben-post p-6 bg-white rounded-lg shadow-lg">
      {/* Back button */}
      <div className="mb-4">
        <a
          href="/"
          className="btn-3d btn-secondary px-4 py-2 text-sm inline-block"
        >
          ← Back to Feed
        </a>
      </div>

      {/* Ben post header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-4">{ben.name}</h1>
        <p className="text-xl mb-2">
          by <span className="glow-text">{ben.users?.name || "Anonymous"}</span>
        </p>
        <p className="text-sm opacity-80">
          {new Date(ben.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Ben image */}
      {ben.image_data && (
        <div className="mb-6 text-center">
          <img
            src={ben.image_data || "/placeholder.svg"}
            alt={ben.name}
            className="border-4 border-white max-w-full mx-auto shadow-lg rounded"
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

      {/* Like button */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleLike}
          disabled={isLiking || !currentUserId}
          className={`btn-3d px-6 py-3 text-xl ${
            optimisticLikes.hasLiked ? "btn-danger" : "btn-warning"
          } ${
            !currentUserId || isLiking ? "opacity-50 cursor-not-allowed" : ""
          }`}
          title={!currentUserId ? "Sign in to like posts" : ""}
        >
          {optimisticLikes.count} LIKES {isLiking ? "..." : ""}
        </button>

        {currentUserId === ben.user_id && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn-3d btn-danger px-6 py-3 text-xl"
          >
            {isDeleting ? "DELETING..." : "DELETE"}
          </button>
        )}
      </div>

      {/* Comments section */}
      <div className="container-yellow p-6">
        <h2 className="text-2xl font-bold mb-4">Comments</h2>

        {/* Add comment form */}
        <form
          action={commentAction}
          className="flex gap-3 mb-6"
          data-ben-id={ben.id}
        >
          <input
            type="text"
            name="content"
            placeholder="Add a comment..."
            className="flex-1 p-3 text-lg rounded border-2 border-gray-300"
            required
            disabled={commentPending}
          />
          <button
            type="submit"
            disabled={commentPending}
            className="btn-3d btn-primary px-6 py-3"
          >
            {commentPending ? "POSTING..." : "POST"}
          </button>
        </form>

        {commentState && "error" in commentState && commentState.error && (
          <div className="text-red-500 mb-4 p-3 bg-red-50 rounded">
            {commentState.error}
          </div>
        )}

        {/* Comments list with virtual scrolling */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white p-4 border-l-4 border-purple-500 rounded shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-purple-600">
                  {comment.users?.name || "Anonymous"}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-800">{comment.content}</p>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              <span className="ml-2">Loading more comments...</span>
            </div>
          )}

          {/* Intersection observer target */}
          {hasMore && !loading && <div ref={observerRef} className="h-4"></div>}

          {/* End of comments indicator */}
          {!hasMore && comments.length > 0 && (
            <div className="text-center py-4 text-gray-500">
              No more comments to load
            </div>
          )}

          {!loading && comments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
