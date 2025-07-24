// src/modules/weather/presentation/screens/WeatherScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { WeatherApi } from "../../infrastructure/weatherApi";
import { FetchWeatheruseCase } from "../../application/useCases/fetchWeather";

export default function WeatherScreen() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState<any>(null);
  const weatherRepo = new WeatherApi();
  const fetchWeather = new FetchWeatheruseCase(weatherRepo);

  const handleFetch = async () => {
    const data = await fetchWeather.execute(city);
    setWeather(data);
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Entrez une ville"
        value={city}
        onChangeText={setCity}
        style={{ borderBottomWidth: 1, marginBottom: 10 }}
      />
      <Button title="Obtenir la météo" onPress={handleFetch} />
      {weather && (
        <View>
          <Text>Ville : {weather.city}</Text>
          <Text>Température : {weather.temperature}°C</Text>
          <Text>Condition : {weather.condition}</Text>
        </View>
      )}
    </View>
  );
}
