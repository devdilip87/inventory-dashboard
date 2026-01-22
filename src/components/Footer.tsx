interface FooterProps {
  isDarkTheme: boolean
}

export function Footer({ isDarkTheme }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={`border-t mt-12 ${isDarkTheme ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className={`font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              About
            </h3>
            <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Advanced demand forecasting system using AI to optimize inventory management and improve supply chain efficiency.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className={`font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              Features
            </h3>
            <ul className={`text-sm space-y-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              <li><a href="#" className="hover:text-blue-500">Real-time Forecasting</a></li>
              <li><a href="#" className="hover:text-blue-500">Regional Analysis</a></li>
              <li><a href="#" className="hover:text-blue-500">Anomaly Detection</a></li>
              <li><a href="#" className="hover:text-blue-500">Smart Recommendations</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className={`font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              Support
            </h3>
            <ul className={`text-sm space-y-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              <li><a href="#" className="hover:text-blue-500">Documentation</a></li>
              <li><a href="#" className="hover:text-blue-500">Help Center</a></li>
              <li><a href="#" className="hover:text-blue-500">API Reference</a></li>
              <li><a href="#" className="hover:text-blue-500">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className={`border-t pt-8 flex flex-col md:flex-row items-center justify-between ${isDarkTheme ? 'border-gray-800' : 'border-gray-200'}`}>
          <p className={`text-sm ${isDarkTheme ? 'text-gray-500' : 'text-gray-600'}`}>
            &copy; {currentYear} Demand Forecasting Dashboard. All rights reserved.
          </p>
          <div className={`text-sm space-x-6 mt-4 md:mt-0 ${isDarkTheme ? 'text-gray-500' : 'text-gray-600'}`}>
            <a href="#" className="hover:text-blue-500">Privacy Policy</a>
            <a href="#" className="hover:text-blue-500">Terms of Service</a>
            <a href="#" className="hover:text-blue-500">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
