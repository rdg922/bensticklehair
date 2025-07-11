"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export async function signInWithGoogle() {
  const supabase = await createClient();

  // Validate environment variables
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const redirectUrl = siteUrl
    ? `${siteUrl}/auth/callback`
    : "http://localhost:3000/auth/callback";

  console.log("Sign in attempt with redirect URL:", redirectUrl);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("OAuth Error:", error);
    redirect("/auth/auth-code-error");
  }

  if (data.url) {
    console.log("Redirecting to OAuth URL:", data.url);
    redirect(data.url);
  } else {
    console.error("No OAuth URL returned");
    redirect("/auth/auth-code-error");
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

  if (name.trim().length > 50) {
    return { error: "Ben name must be 50 characters or less" };
  }

  if (!imageData) {
    return { error: "Image data is required" };
  }

  if (!birthdayMessage?.trim()) {
    return { error: "Birthday message is required" };
  }

  if (birthdayMessage.trim().length > 240) {
    return { error: "Birthday message must be 240 characters or less" };
  }

  // Convert base64 data URL to blob for upload
  let imageUrl: string;

  try {
    // Extract base64 data from data URL
    const base64Data = imageData.split(",")[1];
    const mimeType = imageData.split(",")[0].split(":")[1].split(";")[0];

    // Convert base64 to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    // Generate unique filename
    const fileExtension = mimeType.split("/")[1] || "png";
    const fileName = `${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("bens")
      .upload(fileName, blob, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      return { error: "Failed to upload image" };
    }

    // Get public URL for the uploaded image
    const { data: urlData } = supabase.storage
      .from("bens")
      .getPublicUrl(uploadData.path);

    imageUrl = urlData.publicUrl;
  } catch (error) {
    console.error("Error processing image:", error);
    return { error: "Failed to process image" };
  }

  const { error } = await supabase.from("bens").insert({
    name: name.trim(),
    image_data: imageUrl,
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
    .slice(0, 5); // Top 5

  return { success: true, data: bensWithLikes };
}

export async function deleteBenPost(benId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Must be logged in to delete posts" };
  }

  // First check if the user owns this ben and get the image data
  const { data: ben, error: fetchError } = await supabase
    .from("bens")
    .select("user_id, image_data")
    .eq("id", benId)
    .single();

  if (fetchError || !ben) {
    console.error("Error fetching ben for deletion:", fetchError);
    return { error: "Ben post not found" };
  }

  if (ben.user_id !== user.id) {
    return { error: "You can only delete your own posts" };
  }

  // Delete the ben post - cascade deletion will handle likes and comments
  const { error } = await supabase
    .from("bens")
    .delete()
    .eq("id", benId)
    .eq("user_id", user.id); // Extra safety check

  if (error) {
    console.error("Error deleting ben post:", error);
    return { error: "Failed to delete ben post" };
  }

  // If the image is stored in Supabase Storage, try to delete it
  if (
    ben.image_data &&
    ben.image_data.includes("/storage/v1/object/public/bens/")
  ) {
    try {
      // Extract the file path from the public URL
      const urlParts = ben.image_data.split("/storage/v1/object/public/bens/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];

        const { error: deleteError } = await supabase.storage
          .from("bens")
          .remove([filePath]);

        if (deleteError) {
          console.warn("Failed to delete image from storage:", deleteError);
          // Don't return error here as the ben post was already deleted
        }
      }
    } catch (storageError) {
      console.warn("Error deleting image from storage:", storageError);
      // Don't return error here as the ben post was already deleted
    }
  }

  // Add a small delay to ensure database changes are committed
  await new Promise((resolve) => setTimeout(resolve, 100));

  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath(`/ben/${benId}`);
  return { success: true };
}
