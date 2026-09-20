import { ParticipantForm } from "@/components/admin/participant-form";
import { requireStaff } from "@/lib/auth";
import { createParticipant } from "../actions";

export const metadata = { title: "Add participant" };

export default async function NewParticipantPage({ searchParams }: PageProps<"/admin/participants/new">) {
  const staff = await requireStaff();
  const { return_to } = await searchParams;
  // Only allow same-site admin paths so this can't be used as an open redirect.
  const returnTo =
    typeof return_to === "string" && return_to.startsWith("/admin/") ? return_to : undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Add participant</h1>
      <ParticipantForm
        action={createParticipant}
        cancelHref={returnTo ?? "/admin/participants"}
        returnTo={returnTo}
        canSetStatus={staff.role === "admin"}
      />
    </div>
  );
}
