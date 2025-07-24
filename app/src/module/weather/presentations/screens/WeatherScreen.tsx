import React, { useEffect, useRef, useState } from "react";
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  StatusBar,
  SafeAreaView,
  Dimensions,
  RefreshControl,
  ScrollView,
  useColorScheme
} from "react-native";
import * as Location from "expo-location";
import { WeatherApi } from "../../infrastructure/weatherApi";
import { FetchWeatheruseCase } from "../../application/useCases/fetchWeather";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type WeatherData = {
  city: string;
  temperature: number;
  condition: string;
};

export default function WeatherScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [city, setCity] = useState<string>("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [region, setRegion] = useState('');
  const [street, setStreet] = useState('');
  const [timezone, setTimezone] = useState('');
  
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const weatherRepo = new WeatherApi();
  const fetchWeather = new FetchWeatheruseCase(weatherRepo);

  const loadWeatherData = async () => {
    try {
      setErrorMsg("");
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission de localisation requise pour afficher la météo.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;

      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (geocode.length > 0 && geocode[0]) {
        const locationData = geocode[0];
        const cityName = locationData.city || locationData.region || "Ville inconnue";
        
        setCity(cityName);
        setRegion(locationData.city || "N/A");
        setStreet(locationData.street || "N/A");
        setTimezone(locationData.timezone || "N/A");

        const weatherData = await fetchWeather.execute(cityName);
        setWeather(weatherData);
        
        // Animation d'entrée
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        setErrorMsg("Impossible de déterminer votre localisation.");
      }
    } catch (error) {
      console.error("Erreur météo :", error);
      setErrorMsg("Erreur lors du chargement des données météo.");
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadWeatherData();
      setLoading(false);
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeatherData();
    setRefreshing(false);
  };

  const translateY = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  const opacity = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const toggleDropdown = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (showDetails) {
      // Fermeture avec animation inverse
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setShowDetails(false));
    } else {
      setShowDetails(true);
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('sun') || conditionLower.includes('clear')) {
      return 'sunny';
    } else if (conditionLower.includes('cloud')) {
      return 'cloudy';
    } else if (conditionLower.includes('rain')) {
      return 'rainy';
    } else if (conditionLower.includes('snow')) {
      return 'snow';
    }
    return 'partly-sunny';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: isDark ? '#1E1E1E' : '#4A90E2' }]}>
        <StatusBar barStyle="light-content" backgroundColor={isDark ? '#1E1E1E' : '#4A90E2'} />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Chargement de la météo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: isDark ? '#2D1B1B' : '#E74C3C' }]}>
        <StatusBar barStyle="light-content" backgroundColor={isDark ? '#2D1B1B' : '#E74C3C'} />
        <View style={styles.errorContent}>
          <Ionicons name="warning-outline" size={48} color="#ffffff" />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#4A90E2' }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={isDark ? '#121212' : '#4A90E2'} 
      />
      
      {/*  Scroll pour refresh les datyas */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ffffff']}
            tintColor="#ffffff"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec ville et bouton détails */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={[
            styles.headerContent, 
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)' }
          ]}>
            <ThemedText style={styles.cityTitle} numberOfLines={1}>
              {street}
            </ThemedText>
            <TouchableOpacity 
              onPress={toggleDropdown}
              style={styles.detailsButton}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={showDetails ? "chevron-up-circle" : "chevron-down-circle"} 
                size={28} 
                color="#ffffff" 
              />
            </TouchableOpacity>
          </View>

          {/* Dropdown des détails */}
          {showDetails && (
            <Animated.View 
              style={[
                styles.dropdown,
                {
                  transform: [{ translateY }],
                  opacity: opacity,
                  backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                }
              ]}
            >
              <View style={styles.dropdownRow}>
                <Ionicons name="location-outline" size={16} color={isDark ? '#AAA' : '#666'} />
                <Text style={[styles.dropdownText, { color: isDark ? '#CCC' : '#333' }]}>
                  {city}, {street}
                </Text>
              </View>
              <View style={styles.dropdownRow}>
                <Ionicons name="time-outline" size={16} color={isDark ? '#AAA' : '#666'} />
                <Text style={[styles.dropdownText, { color: isDark ? '#CCC' : '#333' }]}>
                  {timezone}
                </Text>
              </View>
            </Animated.View>
          )}
        </Animated.View>

        {/* Corps principal avec température */}
        <Animated.View 
          style={[
            styles.mainContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* Icône météo */}
          <View style={styles.weatherIconContainer}>
            <Ionicons 
              name={getWeatherIcon(weather?.condition || '')} 
              size={100} 
              color={isDark ? '#FFD700' : '#FFA500'} 
            />
          </View>

          {/* Température */}
          <ThemedText 
            style={styles.temperatureText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {weather?.temperature ? `${Math.round(weather.temperature)}°` : "N/A"}
          </ThemedText>

          {/* Condition météo */}
          <Text style={styles.conditionText}>
            {weather?.condition || "Condition inconnue"}
          </Text>

          {/* Informations supplémentaires */}
          <View style={styles.additionalInfo}>
            <View style={[
              styles.infoCard,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.15)' }
            ]}>
              <Ionicons name="thermometer-outline" size={24} color="#ffffff" />
              <Text style={styles.infoLabel}>Ressenti</Text>
              <Text style={styles.infoValue}>
                {weather?.temperature ? `${Math.round(weather.temperature)}°C` : "N/A"}
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // flexDirection: 'column',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 15,
    fontFamily: 'SpaceMono',
  },
  errorContainer: {
    flex: 1,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
    fontFamily: 'SpaceMono',
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    marginBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    backdropFilter: 'blur(10px)',
  },
  cityTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'SpaceMono',
    flex: 1,
  },
  detailsButton: {
    padding: 5,
  },
  dropdown: {
    marginTop: 10,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    backdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(255, 255, 255, 0.155)',
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dropdownText: {
    marginLeft: 10,
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
  mainContent: {
    alignItems: 'center',
    flex: 1,
  },
  weatherIconContainer: {
    marginBottom: 20,
  },
  temperatureText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'SpaceMono',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  conditionText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'SpaceMono',
    textTransform: 'capitalize',
  },
  additionalInfo: {
    marginTop: 40,
    width: '100%',
  },
  infoCard: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  infoLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 8,
    fontFamily: 'SpaceMono',
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
    fontFamily: 'SpaceMono',
  },
});