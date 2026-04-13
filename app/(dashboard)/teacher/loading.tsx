export default function Loading() {
  return (
    <div className="p-8 max-w-5xl mx-auto animate-pulse">
      <div className="h-8 w-40 bg-neutral-200 rounded-lg mb-2" />
      <div className="h-4 w-56 bg-neutral-100 rounded mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-neutral-200 rounded-xl p-6 h-28" />
        ))}
      </div>
      <div className="bg-white border border-neutral-200 rounded-xl h-64" />
    </div>
  )
}
