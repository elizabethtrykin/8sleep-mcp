import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from './config.js';

interface AuthResponse {
  access_token: string;
  expires_in: number;
  userId: string;
}

export interface SleepStages {
  awake?: number;
  light?: number;
  deep?: number;
  rem?: number;
}

export interface SleepScore {
  total?: number;
  hrv?: number;
  breathing?: number;
  tossAndTurns?: number;
}

export interface Alarm {
  enabled: boolean;
  id: string;
  time: string;  // HH:mm format
  daysOfWeek: number[];
  vibration: boolean;
  sound?: string;
}

export interface DeviceStatus {
  online: boolean;
  firmwareVersion: string;
  lastSeen?: string;
  waterLevel?: number;
  processing?: boolean;
}

export interface TemperatureSchedule {
  id: string;
  startTime: string;  // HH:mm format
  level: number;
  daysOfWeek: number[];
  enabled: boolean;
}

export interface UserPreferences {
  units: 'imperial' | 'metric';
  timezone: string;
  bedSide: 'left' | 'right' | null;
  sleepGoal?: number;  // in minutes
}

export class EightSleepClient {
  private token: string | null = null;
  private userId: string | null = null;
  private client: AxiosInstance;
  private authClient: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.api.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Eight Sleep MCP Client/1.0',
        'Accept': 'application/json',
      },
    });

    this.authClient = axios.create({
      baseURL: config.api.authUrl,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Eight Sleep MCP Client/1.0',
        'Accept': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(async (config) => {
      if (!this.token) {
        await this.authenticate();
      }
      if (config.headers && this.token) {
        config.headers['Authorization'] = `Bearer ${this.token}`;
      }
      return config;
    });

    // Add response interceptor to handle token expiration
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token might be expired, try to re-authenticate
          this.token = null;
          await this.authenticate();
          // Retry the original request
          const config = error.config;
          if (config && this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
            return this.client.request(config);
          }
        }
        throw error;
      }
    );
  }

  private async authenticate(): Promise<void> {
    if (!config.auth.email || !config.auth.password) {
      throw new Error('Missing required credentials. Please check your .env file for EIGHT_SLEEP_EMAIL and EIGHT_SLEEP_PASSWORD');
    }

    try {
      const payload = {
        client_id: config.auth.clientId,
        client_secret: config.auth.clientSecret,
        grant_type: 'password',
        username: config.auth.email,
        password: config.auth.password,
      };

      const response = await this.authClient.post<AuthResponse>('', payload);

      if (!response.data.access_token) {
        throw new Error('Invalid authentication response from Eight Sleep');
      }

      this.token = response.data.access_token;
      this.userId = config.auth.userId;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to authenticate with Eight Sleep: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('Failed to authenticate with Eight Sleep');
    }
  }

  async getUsers(): Promise<Record<string, any>> {
    try {
      if (!this.userId) {
        await this.authenticate();
      }
      if (!this.userId) {
        throw new Error('Not authenticated');
      }
      const response = await this.client.get(`/users/me`);
      return { [this.userId]: response.data };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to get users: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async getCurrentTempData(userId: string): Promise<any> {
    try {
      // First get the user's current device data
      const userResponse = await this.client.get(`/users/${userId}/temperature`);
      
      // Get the current temperature data
      const currentTemp = userResponse.data.currentState.level;
      const targetTemp = userResponse.data.currentLevel;
      
      return {
        current: currentTemp,
        target: targetTemp,
        heating: targetTemp > 0,
        cooling: targetTemp < 0
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to get temperature data: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async setTempLevel(userId: string, level: number, duration: number = 0): Promise<any> {
    try {
      // First set the base temperature level
      await this.client.put(`/users/${userId}/temperature`, {
        currentLevel: level
      });

      // Then set the duration if specified
      if (duration > 0) {
        await this.client.put(`/users/${userId}/temperature`, {
          timeBased: {
            level: level,
            durationSeconds: duration
          }
        });
      }

      return { message: 'Temperature updated successfully' };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to set temperature: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async getSleepData(userId: string, startDate: string, endDate?: string): Promise<any[]> {
    try {
      // Use the trends endpoint with proper parameters
      const params: Record<string, string> = {
        tz: "America/Los_Angeles",  // Using proper IANA timezone format
        from: startDate,
        to: endDate || new Date(new Date(startDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "include-main": "false",
        "include-all-sessions": "true",
        "model-version": "v2"
      };

      const response = await this.client.get(`/users/${userId}/trends`, { params });
      return response.data.days || [];
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to get sleep data: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async getSleepScore(userId: string, date: string): Promise<SleepScore> {
    try {
      const sleepData = await this.getSleepData(userId, date);
      if (!sleepData || sleepData.length === 0) {
        throw new Error(`No sleep data found for date ${date}`);
      }

      const dayData = sleepData[0];
      return {
        total: dayData.score,
        hrv: dayData.sleepQualityScore?.hrv?.score,
        breathing: dayData.sleepQualityScore?.respiratoryRate?.score,
        tossAndTurns: dayData.tnt
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to get sleep score: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async getSleepStages(userId: string, date: string): Promise<SleepStages> {
    try {
      const sleepData = await this.getSleepData(userId, date);
      if (!sleepData || sleepData.length === 0) {
        throw new Error(`No sleep data found for date ${date}`);
      }

      const dayData = sleepData[0];
      const stages = dayData.stages || [];
      
      const stageMap: SleepStages = {};
      for (const stage of stages) {
        if (stage.stage && stage.duration) {
          stageMap[stage.stage.toLowerCase() as keyof SleepStages] = stage.duration;
        }
      }

      return stageMap;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to get sleep stages: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async getPresence(userId: string): Promise<boolean> {
    try {
      const response = await this.client.get(`/users/${userId}/presence`);
      return response.data.presence || false;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to get presence: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async getHrv(userId: string, date: string): Promise<number | undefined> {
    try {
      const sleepData = await this.getSleepData(userId, date);
      if (!sleepData || sleepData.length === 0) {
        throw new Error(`No sleep data found for date ${date}`);
      }

      const dayData = sleepData[0];
      return dayData.sleepQualityScore?.hrv?.score;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to get HRV: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  // Alarm Management
  async getAlarms(userId: string): Promise<Alarm[]> {
    const response = await this.client.get(`/users/${userId}/alarms`);
    return response.data.alarms;
  }

  async setAlarm(userId: string, alarm: Omit<Alarm, 'id'>): Promise<Alarm> {
    const response = await this.client.post(`/users/${userId}/alarms`, alarm);
    return response.data.alarm;
  }

  async updateAlarm(userId: string, alarmId: string, alarm: Partial<Alarm>): Promise<Alarm> {
    const response = await this.client.patch(`/users/${userId}/alarms/${alarmId}`, alarm);
    return response.data.alarm;
  }

  async deleteAlarm(userId: string, alarmId: string): Promise<void> {
    await this.client.delete(`/users/${userId}/alarms/${alarmId}`);
  }

  // Device Control
  async getDeviceStatus(userId: string): Promise<DeviceStatus> {
    const response = await this.client.get(`/users/${userId}/devices/status`);
    return response.data.status;
  }

  async setDevicePower(userId: string, on: boolean): Promise<void> {
    await this.client.post(`/users/${userId}/devices/power`, { on });
  }

  // Additional Sleep Data
  async getRespiratoryRate(userId: string, date: string): Promise<number> {
    const response = await this.client.get(`/users/${userId}/sleep/respiratory_rate`, {
      params: { date }
    });
    return response.data.average;
  }

  async getHeartRate(userId: string, date: string): Promise<{
    average: number;
    min: number;
    max: number;
  }> {
    const response = await this.client.get(`/users/${userId}/sleep/heart_rate`, {
      params: { date }
    });
    return response.data;
  }

  async getSleepTiming(userId: string, date: string): Promise<{
    bedtime: string;
    waketime: string;
    duration: number;
  }> {
    const response = await this.client.get(`/users/${userId}/sleep/timing`, {
      params: { date }
    });
    return response.data;
  }

  async getSleepFitnessTrends(userId: string, days: number = 7): Promise<{
    date: string;
    score: number;
  }[]> {
    const response = await this.client.get(`/users/${userId}/sleep/fitness/trends`, {
      params: { days }
    });
    return response.data.trends;
  }

  // Temperature Scheduling
  async getTemperatureSchedules(userId: string): Promise<TemperatureSchedule[]> {
    const response = await this.client.get(`/users/${userId}/temperature/schedules`);
    return response.data.schedules;
  }

  async setTemperatureSchedule(userId: string, schedule: Omit<TemperatureSchedule, 'id'>): Promise<TemperatureSchedule> {
    const response = await this.client.post(`/users/${userId}/temperature/schedules`, schedule);
    return response.data.schedule;
  }

  async updateTemperatureSchedule(userId: string, scheduleId: string, schedule: Partial<TemperatureSchedule>): Promise<TemperatureSchedule> {
    const response = await this.client.patch(`/users/${userId}/temperature/schedules/${scheduleId}`, schedule);
    return response.data.schedule;
  }

  async deleteTemperatureSchedule(userId: string, scheduleId: string): Promise<void> {
    await this.client.delete(`/users/${userId}/temperature/schedules/${scheduleId}`);
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    const response = await this.client.get(`/users/${userId}/preferences`);
    return response.data.preferences;
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const response = await this.client.patch(`/users/${userId}/preferences`, preferences);
    return response.data.preferences;
  }
} 