import { notFound } from "next/navigation";
import { CoachForm } from "@/components/admin/coach-form";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Coach } from "@/lib/types";
import { deleteCoach, updateCoach } from "../actions";

export const metadata = { title: "Edit coach" };

export default async function EditCoachPage({ params }: PageProps<"/admin/coaches/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("coaches").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Edit {data.full_name}</h1>
      <CoachForm action={updateCoach.bind(null, id)} deleteAction={deleteCoach.bind(null, id)} coach={data as Coach} />
    </div>
  );
}
