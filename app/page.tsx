import { createClient } from "@/lib/supabase-server";
import { BenPost } from "@/components/ben-post";
import { SiteHeader } from "@/components/site-header";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: bens } = await supabase
    .from("bens")
    .select(
      `
      *,
      users(name),
      ben_likes(count),
      ben_comments(id, content, created_at, users(name))
    `
    )
    .order("created_at", { ascending: false });

  // Get user's likes if logged in
  let userLikes: string[] = [];
  if (user) {
    const { data: likes } = await supabase
      .from("ben_likes")
      .select("ben_id")
      .eq("user_id", user.id);

    userLikes = likes?.map((like) => like.ben_id) || [];
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-4">
        <SiteHeader currentPage="home" />

        <main>
          {bens && bens.length > 0 ? (
            <div className="space-y-8">
              {bens.map((ben) => (
                <BenPost
                  key={ben.id}
                  ben={ben}
                  userLikes={userLikes}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          ) : (
            <div className="container-yellow p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">NO BENS YET</h3>
              <p className="text-xl mb-4">Be the first to create one</p>
              <a
                href="/editor"
                className="btn-3d btn-primary px-6 py-3 text-xl inline-block"
              >
                DRAW THE FIRST BEN
              </a>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
