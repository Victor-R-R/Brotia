const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast'

export type CurrentWeather = {
  temperature_2m:       number
  relative_humidity_2m: number
  wind_speed_10m:       number
}

export const fetchWeather = async (lat: number, lng: number): Promise<CurrentWeather | null> => {
  try {
    const url = `${OPEN_METEO}?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`
    const res  = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return data.current as CurrentWeather
  } catch {
    return null
  }
}
