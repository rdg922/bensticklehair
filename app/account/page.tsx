import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { AccountForm } from "@/components/account-form";
import { AccountBenItem } from "@/components/account-ben-item";
import { SiteHeader } from "@/components/site-header";

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: userBens } = await supabase
    .from("bens")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-4">
        <SiteHeader currentPage="account" />

        <main>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="container-pink p-6">
              <AccountForm user={userProfile} />
            </div>

            <div className="container-green p-6">
              <h2 className="text-2xl font-bold mb-4 text-white">YOUR BENS</h2>
              {userBens && userBens.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {userBens.map((ben) => (
                    <AccountBenItem key={ben.id} ben={ben} />
                  ))}
                </div>
              ) : (
                <div className="text-center text-white">
                  <p className="text-xl mb-4">No bens yet</p>
                  <a
                    href="/editor"
                    className="btn-3d btn-success px-6 py-3 inline-block"
                  >
                    CREATE YOUR FIRST BEN
                  </a>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
