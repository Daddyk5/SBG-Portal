export function InvalidLink() {
  return (
    <div className="card space-y-2 p-6">
      <h1 className="text-2xl font-bold">Link not recognised</h1>
      <p className="text-muted">
        This link isn&apos;t valid, or your membership is inactive. Please ask a coach for your personal QR
        code.
      </p>
    </div>
  );
}
