import { useState, useRef, useEffect } from 'react'
import { DemandForecastingWidget } from './widgets/DemandForecastingWidget'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { supabase } from './lib/supabase'

interface ForecastRecord {
  item: string;
  category?: string;
  region: string;
  forecasted_demand: number;
  on_hand_inventory: number;
  expected_inventory: number;
  confidence_score: number;
  anomaly_flag?: boolean;
  insight_reasoning?: string;
}

interface ForecastData {
  summary: string;
  forecast_data: ForecastRecord[];
  recommendation: string;
}

function App() {
  const [isDarkTheme, setIsDarkTheme] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [forecastData, setForecastData] = useState<ForecastData>({
    summary: "",
    forecast_data: [],
    recommendation: ""
  })
  const widgetRef = useRef<{ handleRefresh: () => void }>(null)
  const hasInitializedRef = useRef(false)

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme)
  }

  const fetchForecastData = async () => {
    try {
      const { data } = await supabase
        .from('demandForcast')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setForecastData(data.agent_response);
      }
    } catch (error) {
      console.error('Error fetching forecast data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      fetchForecastData();
    }
  }, []);

  const handleRefresh = () => {
    setIsLoading(true)
    fetchForecastData()
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDarkTheme ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <Header 
        isDarkTheme={isDarkTheme} 
        onThemeToggle={toggleTheme}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <DemandForecastingWidget 
            isDarkTheme={isDarkTheme} 
            ref={widgetRef}
            data={forecastData}
          />
        </div>
      </main>

      <Footer isDarkTheme={isDarkTheme} />
    </div>
  )
}

export default App