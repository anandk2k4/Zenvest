const AboutZenVest = () => {
    return (
      <section id="about" className="py-16 px-6 md:px-20 text-gray-800">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-700 mb-4">About ZenVest</h2>
          <p className="text-gray-600 text-md max-w-4xl mx-auto">
            <i>
                "Empowering you with AI-guided financial clarity. Here's how ZenVest brings peace of mind to your money"
            </i>
          </p>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Card 1 */}
          <div className="border border-gray-200 bg-white rounded-xl p-6 shadow-sm hover:shadow-md hover:border-green-400 transition">
            <h3 className="text-xl font-semibold text-emerald-600 mb-2">All-in-One Platform</h3>
            <p className="text-gray-700 text-sm">
              ZenVest helps you plan budgets, track goals, and receive AI-driven financial advice — all in one dashboard.
            </p>
          </div>
  
          {/* Card 2 */}
          <div className="border border-gray-200 bg-white rounded-xl p-6 shadow-sm hover:shadow-md hover:border-green-400 transition">
            <h3 className="text-xl font-semibold text-emerald-600 mb-2">Built for Everyone</h3>
            <p className="text-gray-700 text-sm">
              Whether you're a student, salaried professional, ZenVest simplifies your financial decisions.
            </p>
          </div>
  
          {/* Card 3 */}
          <div className="border border-gray-200 bg-white rounded-xl p-6 shadow-sm hover:shadow-md hover:border-green-400 transition">
            <h3 className="text-xl font-semibold text-emerald-600 mb-2">Peace of Mind</h3>
            <p className="text-gray-700 text-sm">
              We don’t just help you grow wealth — we reduce stress. Smart planning for a simplified life.
            </p>
          </div>
        </div>
      </section>
    );
  };
  
  export default AboutZenVest;
  