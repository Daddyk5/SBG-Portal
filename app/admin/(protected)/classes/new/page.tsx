import { ClassForm } from "@/components/admin/class-form";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createClass } from "../actions";

export const metadata = { title: "Add class" };

export default async function NewClassPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: coaches } = await supabase.from("coaches").select("id, full_name").order("full_name");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Add class</h1>
      <ClassForm action={createClass} coaches={coaches ?? []} />
    </div>
  );
}
