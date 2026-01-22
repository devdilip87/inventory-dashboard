import { TrendingUp, Sun, Moon, RefreshCw } from "lucide-react"
import { Button } from "../ui/button"

interface HeaderProps {
  isDarkTheme: boolean
  onThemeToggle: () => void
  onRefresh?: () => void
  isLoading?: boolean
}

export function Header({ isDarkTheme, onThemeToggle, onRefresh, isLoading }: HeaderProps) {
  return (
    <header className={`sticky top-0 z-50 border-b ${isDarkTheme ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDarkTheme ? 'bg-blue-900' : 'bg-blue-100'}`}>
            <TrendingUp className={`h-6 w-6 ${isDarkTheme ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
              Demand Forecasting
            </h1>
            <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Intelligent inventory management powered by AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              className={isDarkTheme ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
            className={isDarkTheme ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
          >
            {isDarkTheme ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  )
}
