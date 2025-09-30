import { useState, useEffect } from 'react';

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
  icon: string;
  forecast?: Array<{
    date: string;
    temperature: number;
    condition: string;
    icon: string;
  }>;
}

export const useWeather = (location: string, apiKey?: string) => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location || location.trim() === '') return;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);

      try {
        // For demo purposes, we'll use a mock API response
        // In production, you would use a real weather API like OpenWeatherMap
        const mockResponse = await fetch(`/api/weather?location=${encodeURIComponent(location)}&apiKey=${apiKey || 'demo'}`);

        if (!mockResponse.ok) {
          throw new Error('Failed to fetch weather data');
        }

        const weatherData = await mockResponse.json();
        setData(weatherData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');

        // Fallback to mock data if API fails
        setData({
          temperature: 22,
          condition: 'Partly Cloudy',
          humidity: 65,
          windSpeed: 12,
          location: location,
          icon: 'partly-cloudy',
          forecast: [
            { date: 'Tomorrow', temperature: 24, condition: 'Sunny', icon: 'sunny' },
            { date: 'Day After', temperature: 26, condition: 'Cloudy', icon: 'cloudy' },
            { date: 'Day 3', temperature: 23, condition: 'Rainy', icon: 'rainy' },
            { date: 'Day 4', temperature: 25, condition: 'Partly Cloudy', icon: 'partly-cloudy' },
            { date: 'Day 5', temperature: 27, condition: 'Sunny', icon: 'sunny' }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    // Debounce API calls
    const timeoutId = setTimeout(fetchWeather, 500);

    return () => clearTimeout(timeoutId);
  }, [location, apiKey]);

  return { data, loading, error };
};
