import { Weather } from "../../domain/entities/Weather";
import { IWeatherRepository } from "../../domain/repositories/IWeatherRepository";

export class FetchWeatheruseCase {
    constructor(private useRepo: IWeatherRepository) {}
    async execute(city: string): Promise<Weather> {
        return this.useRepo.getWeather(city);
    }
}