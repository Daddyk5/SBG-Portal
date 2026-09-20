import { notFound } from "next/navigation";
import { ParticipantForm } from "@/components/admin/participant-form";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Participant } from "@/lib/types";
import { updateParticipant } from "../../actions";

export const metadata = { title: "Edit participant" };

export default async function EditParticipantPage({ params }: PageProps<"/admin/participants/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("participants").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Edit {data.full_name}</h1>
      <ParticipantForm
        action={updateParticipant.bind(null, id)}
        participant={data as Participant}
        cancelHref={`/admin/participants/${id}`}
      />
    </div>
  );
}
