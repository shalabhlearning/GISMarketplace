export default function ProviderStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard title="Active Services" value="0" />
      <StatCard title="Open Proposals" value="0" />
      <StatCard title="Credits Balance" value="0" />
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <p className="text-xs uppercase text-gray-500 tracking-wide">
        {title}
      </p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}
