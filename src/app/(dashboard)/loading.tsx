export default function DashboardLoading() {
  return (
    <div className="w-full h-full">
      {/* Simple top loading bar */}
      <div className="h-0.5 w-full bg-gray-800">
        <div className="h-full w-1/3 bg-green-500 animate-pulse" />
      </div>
      <div className="px-8 pt-6 pb-4 md:pt-10 md:pb-8 lg:px-12 max-w-[1920px] mx-auto">
        <div className="space-y-6">
          <div className="h-8 w-48 bg-gray-800 rounded-md animate-pulse" />
          <div className="h-4 w-80 bg-gray-800 rounded-md animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="h-40 bg-gray-900 rounded-xl border border-gray-800 animate-pulse" />
            <div className="h-40 bg-gray-900 rounded-xl border border-gray-800 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}


