import type { Metadata } from "next";
import { MemberRedirect } from "@/components/member/member-redirect";

export const metadata: Metadata = {
  title: "Check in",
  robots: { index: false, follow: false },
};

/** Target of the QR code posted at the gym door. */
export default function CheckInDoorPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div className="card w-full p-8">
        <MemberRedirect to="check-in" />
      </div>
    </div>
  );
}
