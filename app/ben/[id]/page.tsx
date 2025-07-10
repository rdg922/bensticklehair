import { createClient } from "@/lib/supabase-server";
import { BenDetailView } from "@/components/ben-detail-view";
import { notFound } from "next/navigation";

interface BenPageProps {
  params: {
    id: string;
  };
}

async function getBenPost(id: string) {
  const supabase = await createClient();

  const { data: ben, error } = await supabase
    .from("bens")
    .select(
      `
      *,
      users:user_id(name),
      ben_likes(count)
    `
    )
    .eq("id", id)
    .single();

  if (error || !ben) {
    return null;
  }

  return ben;
}

async function getUserLikes() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { likes: [], userId: null };
  }

  const { data: likes } = await supabase
    .from("ben_likes")
    .select("ben_id")
    .eq("user_id", user.id);

  return {
    likes: likes?.map((like) => like.ben_id) || [],
    userId: user.id,
  };
}

export default async function BenPage({ params }: BenPageProps) {
  const ben = await getBenPost(params.id);

  if (!ben) {
    notFound();
  }

  const { likes: userLikes, userId: currentUserId } = await getUserLikes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <BenDetailView
            ben={ben}
            userLikes={userLikes}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </div>
  );
}
