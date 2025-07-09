"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/auth/callback`,
    },
  });

  if (error) {
    console.error("Error:", error);
    redirect("/auth/auth-code-error");
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error:", error);
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function updateUserProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = formData.get("name") as string;

  if (!name?.trim()) {
    return { error: "Name is required" };
  }

  const { error } = await supabase
    .from("users")
    .update({ name: name.trim() })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return { error: "Failed to update profile" };
  }

  revalidatePath("/account");
  return { success: true };
}

export async function createBenPost(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = formData.get("name") as string;
  const imageData = formData.get("imageData") as string;
  const birthdayMessage = formData.get("birthdayMessage") as string;

  if (!name?.trim()) {
    return { error: "Ben name is required" };
  }

  if (!imageData) {
    return { error: "Image data is required" };
  }

  if (!birthdayMessage?.trim()) {
    return { error: "Birthday message is required" };
  }

  const { error } = await supabase.from("bens").insert({
    name: name.trim(),
    image_data: imageData,
    birthday_message: birthdayMessage.trim(),
    user_id: user.id,
  });

  if (error) {
    console.error("Error creating ben post:", error);
    return { error: "Failed to create ben post" };
  }

  revalidatePath("/");
  redirect("/");
}

export async function likeBenPost(benId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Must be logged in to like posts" };
  }

  // Check if user already liked this ben
  const { data: existingLike } = await supabase
    .from("ben_likes")
    .select("id")
    .eq("ben_id", benId)
    .eq("user_id", user.id)
    .single();

  if (existingLike) {
    return { error: "Already liked this ben" };
  }

  const { error } = await supabase.from("ben_likes").insert({
    ben_id: benId,
    user_id: user.id,
  });

  if (error) {
    console.error("Error liking ben:", error);
    return { error: "Failed to like ben" };
  }

  revalidatePath("/");
  return { success: true };
}

export async function dislikeBenPost(benId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Must be logged in to unlike posts" };
  }

  // Check if user has liked this ben first
  const { data: existingLike } = await supabase
    .from("ben_likes")
    .select("id")
    .eq("ben_id", benId)
    .eq("user_id", user.id)
    .single();

  if (!existingLike) {
    return { error: "You haven't liked this ben yet" };
  }

  // Delete the like
  const { error } = await supabase
    .from("ben_likes")
    .delete()
    .eq("ben_id", benId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error disliking ben:", error);
    return { error: "Failed to unlike ben" };
  }

  revalidatePath("/");
  return { success: true };
}

export async function addBenComment(benId: string, content: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Must be logged in to comment" };
  }

  if (!content?.trim()) {
    return { error: "Comment cannot be empty" };
  }

  const { error } = await supabase.from("ben_comments").insert({
    ben_id: benId,
    user_id: user.id,
    content: content.trim(),
  });

  if (error) {
    console.error("Error adding comment:", error);
    return { error: "Failed to add comment" };
  }

  revalidatePath("/");
  return { success: true };
}

export async function getHallOfFameBens() {
  const supabase = await createClient();

  // Get all bens with their users and like counts
  const { data: allBens, error } = await supabase.from("bens").select(`
      *,
      users:user_id(name),
      ben_likes(id)
    `);

  if (error) {
    console.error("Error fetching hall of fame bens:", error);
    return { error: "Failed to load Hall of Fame" };
  }

  if (!allBens || allBens.length === 0) {
    return { success: true, data: [] };
  }

  // Calculate like counts and sort by likes
  const bensWithLikes = allBens
    .map((ben: any) => ({
      ...ben,
      like_count: ben.ben_likes?.length || 0,
    }))
    .filter((ben: any) => ben.like_count > 0) // Only show bens with likes
    .sort((a: any, b: any) => b.like_count - a.like_count)
    .slice(0, 10); // Top 10

  return { success: true, data: bensWithLikes };
}
