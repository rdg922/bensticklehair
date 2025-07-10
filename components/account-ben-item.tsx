"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteBenPost } from "@/lib/actions";

interface AccountBenItemProps {
  ben: any;
}

export function AccountBenItem({ ben }: AccountBenItemProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${ben.name}"? This action cannot be undone.`
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

  return (
    <div className="bg-white p-3 border-4 border-purple-400">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {ben.image_data && (
            <img
              src={ben.image_data || "/placeholder.svg"}
              alt={ben.name}
              className="w-16 h-20 border-2 border-gray-400 object-cover"
            />
          )}
          <div>
            <p className="font-bold text-lg text-purple-600">{ben.name}</p>
            <p className="text-sm text-gray-600">
              {new Date(ben.created_at).toLocaleDateString()}
            </p>
            <a
              href={`/ben/${ben.id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              View Details
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn-3d btn-danger px-3 py-1 text-sm"
          >
            {isDeleting ? "DELETING..." : "DELETE"}
          </button>
        </div>
      </div>
    </div>
  );
}
