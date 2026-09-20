import { notFound } from "next/navigation";
import { ClassForm } from "@/components/admin/class-form";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ClassRow } from "@/lib/types";
import { deleteClass, updateClass } from "../actions";

export const metadata = { title: "Edit class" };

export default async function EditClassPage({ params }: PageProps<"/admin/classes/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const [classRes, coachesRes] = await Promise.all([
    supabase.from("classes").select("*").eq("id", id).maybeSingle(),
    supabase.from("coaches").select("id, full_name").order("full_name"),
  ]);
  if (!classRes.data) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Edit class</h1>
      <ClassForm
        action={updateClass.bind(null, id)}
        deleteAction={deleteClass.bind(null, id)}
        item={classRes.data as ClassRow}
        coaches={coachesRes.data ?? []}
      />
    </div>
  );
}
