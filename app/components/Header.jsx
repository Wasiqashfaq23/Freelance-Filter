export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">FreelanceFilter</h1>
              <p className="text-xs text-gray-500">Smart Project Evaluation</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
              How it Works
            </a>
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
              Features
            </a>
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
              Analytics
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
