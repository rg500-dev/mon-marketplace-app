export default function ProductsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Tous les produits</h1>
      
      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md h-fit">
          <h3 className="font-bold mb-4">Filtres</h3>
          
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Catégories</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Électronique</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Vêtements</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Meubles</span>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold mb-2">Prix</h4>
            <div className="space-y-2">
              <input 
                type="range" 
                className="w-full"
                min="0"
                max="10000"
              />
              <p className="text-sm text-gray-600">0€ - 10000€</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">État</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Neuf</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Comme neuf</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Bon état</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>À restaurer</span>
              </label>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="md:col-span-3">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Product Card */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                <div className="bg-gray-300 h-48 flex items-center justify-center">
                  <span className="text-gray-500">Image du produit</span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">Produit {i}</h3>
                  <p className="text-gray-600 text-sm mb-3">Description courte du produit</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">99.99€</span>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                      Voir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
