import axios from "axios";
import { Weather } from "../domain/entities/Weather";
import { IWeatherRepository } from "../domain/repositories/IWeatherRepository";

export class WeatherApi implements IWeatherRepository {
    async getWeather(city: string): Promise<Weather> {
        // throw new Error("Method not implemented.");
        const API_KEY = '32a3c53ee027e88f725ebe8cfdb5f468'
        const res = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        const data = res.data;
        return new Weather(data.main.temp, data.weather[0].description, data.name)
    }

}