/* eslint-disable @next/next/no-img-element -- QR data URL */
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { AttendanceHeatmap } from "@/components/attendance-heatmap";
import { Avatar } from "@/components/avatar";
import { LogAttendanceForm, ProgressionForm } from "@/components/admin/log-forms";
import { MemberAccessCard } from "@/components/admin/member-access-card";
import { BeltBadge } from "@/components/belt-badge";
import { requireStaff } from "@/lib/auth";
import { formatDate, gymToday } from "@/lib/constants";
import { SITE } from "@/lib/site";
import { signParticipantPhotos } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import type { ClassRow, Participant, ProgressionEntry } from "@/lib/types";
import { suggestUsername } from "@/lib/passwords";
import { addProgression, logAttendance } from "../actions";
import { createMemberLogin, resetMemberPassword } from "../access-actions";

type AttendanceWithClass = {
  id: string;
  session_date: string;
  check_in_method: "staff" | "qr";
  classes: { name: string } | null;
};

export async function generateMetadata({ params }: PageProps<"/admin/participants/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("participants").select("full_name").eq("id", id).maybeSingle();
  return { title: data?.full_name ?? "Participant" };
}

export default async function ParticipantProfilePage({ params }: PageProps<"/admin/participants/[id]">) {
  const staff = await requireStaff();
  const { id } = await params;
  const supabase = await createClient();
  const today = gymToday().date;

  const [participantRes, attendanceRes, progressionRes, classesRes] = await Promise.all([
    supabase.from("participants").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("attendance")
      .select("id, session_date, check_in_method, classes(name)")
      .eq("participant_id", id)
      .order("session_date", { ascending: false })
      .order("checked_in_at", { ascending: false })
      .limit(1000)
      .overrideTypes<AttendanceWithClass[]>(),
    supabase
      .from("progression_log")
      .select("*")
      .eq("participant_id", id)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("classes").select("id, name, day_of_week, start_time").order("day_of_week").order("start_time"),
  ]);

  const participant = participantRes.data as Participant | null;
  if (!participant) notFound();

  const attendance = attendanceRes.data ?? [];
  const progression = (progressionRes.data ?? []) as ProgressionEntry[];
  const classes = (classesRes.data ?? []) as Pick<ClassRow, "id" | "name" | "day_of_week" | "start_time">[];
  const photos = await signParticipantPhotos(supabase, [participant.photo_url]);
  const photoUrl = participant.photo_url ? photos.get(participant.photo_url) : null;

  const qrLink = `${SITE.url}/m/${participant.checkin_token}`;
  const qrImage = await QRCode.toDataURL(qrLink, { margin: 1, width: 240 });

  return (
    <div className="space-y-8">
      <Link href="/admin/participants" className="text-sm text-muted hover:text-foreground">
        ← All participants
      </Link>

      <header className="flex flex-wrap items-center gap-4">
        <Avatar name={participant.full_name} src={photoUrl} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{participant.full_name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <BeltBadge belt={participant.belt_rank} stripes={participant.stripes} label={`${participant.belt_rank} belt`} />
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                participant.status === "active" ? "bg-success/15 text-success" : "bg-foreground/10 text-muted"
              }`}
            >
              {participant.status}
            </span>
          </div>
        </div>
        {staff.role === "admin" && (
          <Link href={`/admin/participants/${id}/edit`} className="btn-secondary">
            Edit
          </Link>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="text-lg font-bold">Details</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Detail label="Email" value={participant.email} />
            <Detail label="Phone" value={participant.phone} />
            <Detail label="Joined" value={formatDate(participant.date_joined)} />
            <Detail label="Programs" value={participant.program.join(", ") || null} />
            <div className="sm:col-span-2">
              <Detail label="Notes" value={participant.notes} multiline />
            </div>
          </dl>
        </section>

        <section className="card p-5" aria-labelledby="qr-heading">
          <h2 id="qr-heading" className="text-lg font-bold">
            Member QR
          </h2>
          <img src={qrImage} alt={`QR code for ${participant.full_name}'s check-in link`} width={160} height={160} className="mt-3 rounded-md bg-white" />
          <p className="mt-2 break-all text-xs text-muted">{qrLink}</p>
          <p className="mt-2 text-xs text-muted">
            Private to this member — it lets them check themselves in to class. Don&apos;t share publicly.
          </p>
        </section>
      </div>

      <MemberAccessCard
        hasLogin={Boolean(participant.user_id)}
        username={participant.username}
        suggestedUsername={suggestUsername(participant.full_name)}
        hasPhone={Boolean(participant.phone)}
        create={createMemberLogin.bind(null, id)}
        reset={resetMemberPassword.bind(null, id)}
      />

      <section className="card p-5">
        <h2 className="text-lg font-bold">Attendance</h2>
        <div className="mt-4">
          <AttendanceHeatmap dates={attendance.map((a) => a.session_date)} today={today} />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div>
            <h3 className="text-sm font-semibold text-muted">Recent sessions</h3>
            {attendance.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No attendance recorded yet.</p>
            ) : (
              <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-surface text-muted">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">Date</th>
                      <th scope="col" className="px-3 py-2 font-medium">Class</th>
                      <th scope="col" className="px-3 py-2 font-medium">Via</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {attendance.slice(0, 100).map((a) => (
                      <tr key={a.id}>
                        <td className="px-3 py-2 tabular-nums">{formatDate(a.session_date)}</td>
                        <td className="px-3 py-2">{a.classes?.name ?? "Deleted class"}</td>
                        <td className="px-3 py-2 text-muted">{a.check_in_method === "qr" ? "QR" : "Staff"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="rounded-lg border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold">Log attendance</h3>
            <LogAttendanceForm action={logAttendance.bind(null, id)} classes={classes} today={today} />
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-bold">Progression</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_24rem]">
          <div>
            {progression.length === 0 ? (
              <p className="text-sm text-muted">No progression entries yet.</p>
            ) : (
              <ol className="relative space-y-5 border-l-2 border-border pl-5">
                {progression.map((entry) => (
                  <li key={entry.id} className="relative">
                    <span className="absolute -left-[1.7rem] top-1.5 size-3 rounded-full border-2 border-background bg-brand" aria-hidden="true" />
                    <p className="text-sm text-muted">{formatDate(entry.entry_date)}</p>
                    {(entry.belt_rank || entry.stripes !== null) && (
                      <div className="mt-1">
                        <BeltBadge
                          belt={entry.belt_rank ?? participant.belt_rank}
                          stripes={entry.stripes ?? 0}
                          label={
                            entry.belt_rank
                              ? `Promoted to ${entry.belt_rank}`
                              : `${entry.stripes} ${entry.stripes === 1 ? "stripe" : "stripes"}`
                          }
                        />
                      </div>
                    )}
                    {entry.note && <p className="mt-1 whitespace-pre-line">{entry.note}</p>}
                    {entry.note && (
                      <p
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          entry.visible_to_member ? "bg-accent/15 text-accent" : "bg-foreground/10 text-muted"
                        }`}
                      >
                        {entry.visible_to_member ? "Sent to member" : "Private — coaches only"}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="rounded-lg border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold">Add progress entry or feedback</h3>
            <ProgressionForm action={addProgression.bind(null, id)} today={today} />
          </div>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value, multiline }: { label: string; value: string | null; multiline?: boolean }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={multiline ? "whitespace-pre-line" : undefined}>{value || "—"}</dd>
    </div>
  );
}
