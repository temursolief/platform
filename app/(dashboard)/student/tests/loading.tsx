export default function Loading() {
  return (
    <div className="p-8 max-w-4xl mx-auto animate-pulse">
      <div className="h-8 w-40 bg-neutral-200 rounded-lg mb-2" />
      <div className="h-4 w-24 bg-neutral-100 rounded mb-8" />
      <div className="grid gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white border border-neutral-200 rounded-xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-neutral-100 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-200 rounded w-3/4" />
              <div className="h-3 bg-neutral-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
