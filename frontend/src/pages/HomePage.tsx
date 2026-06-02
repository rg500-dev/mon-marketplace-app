export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Bienvenue sur Marketplace</h1>
          <p className="text-xl mb-8">
            Achetez et vendez les meilleures affaires de votre région
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100">
              Commencer à vendre
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700">
              Parcourir les annonces
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold mb-12 text-center">Pourquoi nous choisir ?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-2">Sécurisé</h3>
            <p className="text-gray-600">Transactions sécurisées et vérification des utilisateurs</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-2">Rapide</h3>
            <p className="text-gray-600">Interface fluide et navigation intuitive</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold mb-2">Messagerie</h3>
            <p className="text-gray-600">Communiquez en temps réel avec les vendeurs</p>
          </div>
        </div>
      </section>
    </div>
  )
}
