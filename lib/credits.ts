import { supabaseAdmin } from "./supabaseServer";

export async function addCredits(userId: string, credits: number) {
    const { data } = await supabaseAdmin
        .from("subscriptions")
        .select("ai_credits")
        .eq("user_id", userId)
        .single();

    const newCredits = (data?.ai_credits || 0) + credits;

    await supabaseAdmin
        .from("subscriptions")
        .upsert({
            user_id: userId,
            ai_credits: newCredits
        });
}
