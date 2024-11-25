import { AITool } from '../ai.interface';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

interface WeatherResponse {
  temperature: number;
  condition: string;
  humidity: number;
  wind: number;
  date: string;
  time?: string;
  period?: string;
}

export class WeatherTool implements AITool {
  name = 'get_weather';
  private readonly API_KEY = process.env.OPENWEATHER_API_KEY;

  private readonly BASE_URL = 'https://api.openweathermap.org/data/2.5';

  async execute(params: {
    city?: string;
    daysFromNow?: number | string;
    period?: 'morning' | 'afternoon' | 'evening' | 'night';
  }): Promise<WeatherResponse> {
    try {
      const city = params.city || 'Paris';
      const daysFromNow = this.parseDaysFromNow(params.daysFromNow);

      // Vérifier si la date demandée est dans les 5 prochains jours
      if (daysFromNow > 5) {
        throw new Error(
          'Je ne peux fournir que les prévisions pour les 5 prochains jours',
        );
      }

      // Si on demande une prévision future
      if (daysFromNow > 0) {
        const response = await axios.get(
          `${this.BASE_URL}/forecast?q=${city}&appid=${this.API_KEY}&units=metric&lang=fr`,
        );

        const forecast = this.findForecastForPeriod(
          response.data.list,
          daysFromNow,
          params.period || 'afternoon',
        );

        if (!forecast) {
          throw new Error(
            `Prévisions non disponibles pour ${city} dans ${daysFromNow} jours`,
          );
        }

        return this.formatWeatherResponse(forecast, params);
      }

      // Pour la météo actuelle
      const response = await axios.get(
        `${this.BASE_URL}/weather?q=${city}&appid=${this.API_KEY}&units=metric&lang=fr`,
      );
      return this.formatWeatherResponse(response.data, params);
    } catch (error: any) {
      console.error('Erreur météo:', error);
      throw new Error(
        error.message || "Impossible d'obtenir les données météo",
      );
    }
  }

  private findForecastForPeriod(
    forecasts: any[],
    daysFromNow: number,
    period: string,
  ): any {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysFromNow);

    // Définir l'heure cible selon la période
    const targetHour =
      {
        morning: 9,
        afternoon: 15,
        evening: 21,
        night: 3,
      }[period] || 15;

    // Trouver la prévision la plus proche de l'heure souhaitée
    return forecasts.find((item: any) => {
      const itemDate = new Date(item.dt * 1000);
      return (
        itemDate.getDate() === targetDate.getDate() &&
        Math.abs(itemDate.getHours() - targetHour) <= 3
      );
    });
  }

  private formatWeatherResponse(data: any, params: any): WeatherResponse {
    const date = new Date(data.dt * 1000);

    return {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].description,
      humidity: data.main.humidity,
      wind: Math.round(data.wind.speed * 3.6), // Conversion en km/h
      date: date.toISOString().split('T')[0],
      time: date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      period: params.period,
    };
  }

  getSchema() {
    return {
      type: 'function',
      function: {
        name: this.name,
        description:
          'Obtenir les prévisions météorologiques (température, conditions, humidité, vent)',
        parameters: {
          type: 'object',
          properties: {
            city: {
              type: 'string',
              description: 'Nom de la ville (par défaut: Paris)',
            },
            daysFromNow: {
              type: 'string',
              description:
                "Nombre de jours ou jour de la semaine (ex: 2, 'jeudi prochain')",
            },
            period: {
              type: 'string',
              enum: ['morning', 'afternoon', 'evening', 'night'],
              description: 'Période de la journée souhaitée',
            },
          },
          required: [],
          additionalProperties: false,
        },
      },
    };
  }

  private parseDaysFromNow(input?: number | string): number {
    if (typeof input === 'number') return input;
    if (!input) return 0;

    const today = new Date();
    const dayNames = [
      'dimanche',
      'lundi',
      'mardi',
      'mercredi',
      'jeudi',
      'vendredi',
      'samedi',
    ];
    const input_lower = input.toLowerCase();

    const targetDay = dayNames.findIndex((day) => input_lower.includes(day));
    if (targetDay !== -1) {
      let daysUntilTarget = targetDay - today.getDay();
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
      }
      return daysUntilTarget;
    }

    return 0;
  }
}
