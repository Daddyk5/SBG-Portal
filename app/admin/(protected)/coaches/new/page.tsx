import { CoachForm } from "@/components/admin/coach-form";
import { requireAdmin } from "@/lib/auth";
import { createCoach } from "../actions";

export const metadata = { title: "Add coach" };

export default async function NewCoachPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Add coach</h1>
      <CoachForm action={createCoach} />
    </div>
  );
}
