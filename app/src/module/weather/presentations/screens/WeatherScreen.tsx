import React, { useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Animated } from "react-native";
import * as Location from "expo-location";
import { WeatherApi } from "../../infrastructure/weatherApi";
import { FetchWeatheruseCase } from "../../application/useCases/fetchWeather";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"

type WeatherData = {
  city: string;
  temperature: number;
  condition: string;
};

export default function WeatherScreen() {
  const [city, setCity] = useState<string>(""); // ville détectée
  const [weather, setWeather] = useState<WeatherData | null>(null); // météo
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  // const [visible, setVisible] = useState(false);
  const [region, setRegion] = useState('')
  const [street, setStreet] = useState('')
  const [timezone, setTimezone] = useState('')
  const dropdownAnim = useRef(new Animated.Value(0)).current;


  const weatherRepo = new WeatherApi();
  const fetchWeather = new FetchWeatheruseCase(weatherRepo);

  useEffect(() => {
    (async () => {
      setLoading(true);

      try {
        const { status, canAskAgain } =
          await Location.requestForegroundPermissionsAsync();
        if (status !== "granted" && !canAskAgain) {
          setErrorMsg("Permission de localisation refusée.");
          setLoading(false);
          // await Location.requestBackgroundPermissionsAsync()
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        const geocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (geocode.length > 0 && geocode[0]) {
          // console.log(geocode[0])
          const cityName = geocode[0].city || geocode[0].region || "Inconnue";
          setCity(cityName);
          setRegion(geocode[0].city ?? "Inconnue")
          setStreet(geocode[0].street ?? "Inconnue")
          setTimezone(geocode[0].timezone ?? "Inconnue")


          const data = await fetchWeather.execute(cityName);
          setWeather(data);
        } else {
          setErrorMsg("Impossible de déterminer la ville.");
        }
      } catch (error) {
        console.error("Erreur météo :", error);
        setErrorMsg("Une erreur est survenue.");
      }

      setLoading(false);
    })();

    //fonction pour l'animation


  }, []);

  const translateY = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0]
  })

  const opacity = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });


  const toggleDropdown = () => {
    Haptics.selectionAsync();
    setShowDetails(!showDetails);

    dropdownAnim.setValue(0); // reset
    Animated.timing(dropdownAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  };


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Chargement de la météo...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>
          {weather?.city}
        </ThemedText>
        <TouchableOpacity onPress={() => {
          Haptics.selectionAsync()
          toggleDropdown()
        }}>
          <Ionicons name="arrow-down-circle" size={24} color="gray"></Ionicons>
        </TouchableOpacity>


      </View>
      {
        showDetails && (
          <Animated.View style={{
            transform: [{ translateY }],
            opacity: opacity,
            backgroundColor: "white",
            flexDirection: "row",
            padding: 10,
            borderRadius: 10,
            position: "absolute",
            top: 43,
            elevation: 5,
            width: "80%",
            height: "9%",
            justifyContent: "space-between",
            borderBottomRightRadius: 25,
            borderBottomLeftRadius: 25,
          }}>
            <ThemedText style={styles.dropdownContent}>
              <Text> {region}, {street} </Text>
            </ThemedText>
            <ThemedText style={styles.dropdownContent}>
              <Text> {timezone} </Text>
            </ThemedText>
          </Animated.View>
        )
      }

      {/* <Text style={styles.title}>Ville :  <ThemedText style={{ fontFamily: "SpaceMono", fontWeight: "bold", fontSize: 24 }}>
        {weather?.city}
      </ThemedText></Text> */}
      {/*       <Text>Température : {weather?.temperature}°C</Text>
      <Text>Condition : {weather?.condition}</Text> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", width: "100%" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  dropdownContent: {
    justifyContent: "center",
    fontFamily: "SpaceMono",
    padding: 10,
  },
  dropdown: {
    top: -17,
    width: "80%",
    height: "9%",
    backgroundColor: "white",
    borderBottomRightRadius: 25,
    borderBottomLeftRadius: 25,

  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "SpaceMono",
    marginLeft: 20,
  },
  header: {
    width: "80%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "white",
    borderRadius: 25,

    height: 60,
    elevation: 3,
  },
});
