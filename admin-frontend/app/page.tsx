export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Admin Panel</h1>
        <p className="text-gray-400 mb-8">Seedite Education Platform</p>
        <a href="/login" className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 inline-block font-medium">
          Login to Admin Panel
        </a>
      </div>
    </div>
  );
}
