export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto">
          {/* لوجو متحرك */}
          <img 
            src="/logo.png" 
            alt="Loading" 
            className="w-32 h-32 object-contain animate-pulse"
          />
          {/* دائرة تدور حول اللوجو */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-500 border-r-black animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-red-600 border-l-yellow-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <p className="mt-6 text-lg font-bold text-gray-700 animate-pulse">جاري التحميل...</p>
        <div className="mt-2 flex justify-center gap-1">
          <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
          <span className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
        </div>
      </div>
    </div>
  )
}