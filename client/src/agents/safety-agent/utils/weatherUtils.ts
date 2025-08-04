export function calculateHeatIndex(temperature: number, humidity: number): number {
  // Simplified heat index calculation
  if (temperature < 27) return temperature;
  
  const index = -8.784695 + 
                1.61139411 * temperature + 
                2.338549 * humidity -
                0.14611605 * temperature * humidity -
                0.012308094 * temperature * temperature -
                0.016424828 * humidity * humidity +
                0.002211732 * temperature * temperature * humidity +
                0.00072546 * temperature * humidity * humidity -
                0.000003582 * temperature * temperature * humidity * humidity;
                
  return Math.round(index);
}

export function calculateWindChill(temperature: number, windSpeed: number): number {
  // Wind chill calculation (valid for temps ≤ 10°C and wind > 4.8 km/h)
  if (temperature > 10 || windSpeed < 4.8) return temperature;
  
  const windChill = 13.12 + 
                    0.6215 * temperature - 
                    11.37 * Math.pow(windSpeed, 0.16) + 
                    0.3965 * temperature * Math.pow(windSpeed, 0.16);
                    
  return Math.round(windChill);
}

export function getWeatherRiskLevel(
  temperature: number, 
  humidity: number, 
  windSpeed: number
): 'low' | 'medium' | 'high' | 'extreme' {
  const heatIndex = calculateHeatIndex(temperature, humidity);
  const windChill = calculateWindChill(temperature, windSpeed);
  
  // Check for extreme conditions
  if (heatIndex > 40 || windChill < -15 || windSpeed > 50) {
    return 'extreme';
  }
  
  // Check for high risk conditions
  if (heatIndex > 35 || windChill < -10 || windSpeed > 30) {
    return 'high';
  }
  
  // Check for medium risk conditions
  if (heatIndex > 30 || windChill < -5 || windSpeed > 20) {
    return 'medium';
  }
  
  return 'low';
}