import { Weather } from "../entities/Weather";

export interface IWeatherRepository {
    getWeather(city: string): Promise<Weather>;
}