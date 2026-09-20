import { SITE } from "@/lib/site";

/** Floating "Chat with us" button that opens the ministry's Facebook Messenger thread. */
export function MessengerButton() {
  return (
    <a
      href={SITE.messenger}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 flex min-h-12 items-center gap-2 rounded-full bg-[#0866ff] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:bottom-6 sm:right-6"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      </svg>
      Chat with us
    </a>
  );
}
