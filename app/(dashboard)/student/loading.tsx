export default function Loading() {
  return (
    <div className="p-8 max-w-5xl mx-auto animate-pulse">
      <div className="h-8 w-48 bg-neutral-200 rounded-lg mb-2" />
      <div className="h-4 w-32 bg-neutral-100 rounded mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-neutral-200 rounded-xl p-6 h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-xl h-56" />
        <div className="bg-white border border-neutral-200 rounded-xl h-56" />
      </div>
    </div>
  )
}
