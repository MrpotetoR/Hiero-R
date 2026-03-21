export function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export function StatusBadge({
  status,
}: {
  status: "idle" | "pending" | "success" | "error";
}) {
  const styles = {
    idle: "bg-gray-100 text-gray-600",
    pending: "bg-amber-50 text-amber-700",
    success: "bg-green-50 text-green-700",
    error: "bg-red-50 text-red-700",
  };

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-4 overflow-x-auto">
      <code>{code}</code>
    </pre>
  );
}
