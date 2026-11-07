export function AdminOnlyMessage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Admins only</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You do not have access to this page. Please ask an admin if you need
        something changed.
      </p>
    </div>
  );
}