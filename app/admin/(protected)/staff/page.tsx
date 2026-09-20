import { AddStaffForm, StaffRow } from "@/components/admin/staff-forms";
import { requireAdmin } from "@/lib/auth";
import { smsProviderName } from "@/lib/sms";
import { createAdminClient, isAdminClientConfigured, NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createStaff, removeStaff, resetStaffPassword, updateStaffPhone } from "./actions";

export const metadata = { title: "Staff" };

type StaffRowData = { user_id: string; full_name: string; role: string; phone: string | null };

export default async function StaffPage() {
  const me = await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff_profiles")
    .select("user_id, full_name, role, phone")
    .order("role")
    .order("full_name");
  const staff = (data ?? []) as StaffRowData[];

  // Emails live in the auth system; reading them needs the server-side secret key.
  const configured = isAdminClientConfigured();
  const emails = new Map<string, string>();
  if (configured) {
    const { data: users } = await createAdminClient().auth.admin.listUsers({ perPage: 200 });
    for (const u of users?.users ?? []) if (u.email) emails.set(u.id, u.email);
  }
  const sms = smsProviderName();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staff</h1>
        <p className="mt-1 text-muted">
          Coaches and admins who can sign in. If someone forgets their password, reset it here and they&apos;ll be texted
          a temporary one.
        </p>
      </div>

      <p role="status" className="card p-4 text-sm">
        {sms === "manual"
          ? "📱 Text messaging isn't connected yet — resets will give you a message to send from your own phone. See docs/accounts-and-sms.md to connect a provider."
          : `📱 Texts are sent through ${sms === "semaphore" ? "Semaphore" : "Twilio"}.`}
      </p>

      {configured ? (
        <AddStaffForm action={createStaff} />
      ) : (
        <p role="alert" className="card border-danger/40 p-4 text-sm text-danger">
          {NOT_CONFIGURED_MESSAGE}
        </p>
      )}

      <ul className="card divide-y divide-border">
        {staff.map((s) => (
          <StaffRow
            key={s.user_id}
            name={s.full_name}
            email={emails.get(s.user_id) ?? null}
            role={s.role}
            phone={s.phone}
            isSelf={s.user_id === me.user_id}
            updatePhone={updateStaffPhone.bind(null, s.user_id)}
            reset={resetStaffPassword.bind(null, s.user_id)}
            remove={removeStaff.bind(null, s.user_id)}
          />
        ))}
      </ul>
    </div>
  );
}
