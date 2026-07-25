import {createClient} from "@/lib/supabase/client";

// is THIS course favorited by the current user?
export async function isFavorite(courseId: number) : Promise<boolean> {
    const supabase = createClient();
    const { data } = await supabase
      .from("favorites")
      .select("course_id")
      .eq("course_id", courseId)
      .maybeSingle();

    return !!data; 
}
    
// add or remove the favorite. `currentlyFav` = the button's current state. returns the NEW state (true = now favorited).
export async function toggleFavorite(
    courseId: number,
    currentlyFav: boolean
    ): Promise<boolean> {
    const supabase = createClient();
    const{
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return currentlyFav; //not logged in -> nothing changes

    if (currentlyFav) {
        await supabase.from("favorites").delete().eq("course_id", courseId);
        return false; //now unfavorited
    }
    
    await supabase.from("favorites").insert({
        user_id: user.id,
        course_id: courseId,
    });

    return true;
}

// all course ids the current user has favorited.
export async function getFavoriteIds(): Promise<number[]> {
  const supabase = createClient();
  const { data } = await supabase.from("favorites").select("course_id");
  return (data ?? []).map((r) => r.course_id as number);
}
 