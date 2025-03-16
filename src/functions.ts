import { User, TemperatureData, SleepData, FunctionSchema } from './types.js';
import { EightSleepClient, SleepScore, SleepStages, Alarm, DeviceStatus, TemperatureSchedule, UserPreferences } from './eight_sleep_client.js';

export class EightSleepFunctions {
  private client: EightSleepClient;

  constructor() {
    this.client = new EightSleepClient();
  }

  async getUsers(): Promise<Record<string, User>> {
    return await this.client.getUsers();
  }

  async getTemperature(userId: string): Promise<TemperatureData> {
    return await this.client.getCurrentTempData(userId);
  }

  async setTemperature(userId: string, level: number, duration: number = 0): Promise<{ message: string }> {
    if (level < -100 || level > 100) {
      throw new Error('Temperature level must be between -100 and 100');
    }
    return await this.client.setTempLevel(userId, level, duration);
  }

  async getSleepData(userId: string, startDate: string, endDate?: string): Promise<SleepData[]> {
    return await this.client.getSleepData(userId, startDate, endDate);
  }

  async getHrv(userId: string, date: string): Promise<{
    date: string;
    hrvData: {
      average?: number;
      min?: number;
      max?: number;
    };
  }> {
    const sleepData = await this.client.getSleepData(userId, date);
    if (!sleepData || sleepData.length === 0) {
      throw new Error(`No sleep data found for date ${date}`);
    }

    const dayData = sleepData[0];
    return {
      date: date,
      hrvData: {
        average: dayData.sleepQualityScore?.hrv?.average,
        min: dayData.sleepQualityScore?.hrv?.minimum,
        max: dayData.sleepQualityScore?.hrv?.maximum
      }
    };
  }

  async getSleepScore(userId: string, date: string): Promise<SleepScore> {
    return await this.client.getSleepScore(userId, date);
  }

  async getSleepStages(userId: string, date: string): Promise<SleepStages> {
    return await this.client.getSleepStages(userId, date);
  }

  async getPresence(userId: string): Promise<{ userId: string; present: boolean }> {
    const present = await this.client.getPresence(userId);
    return { userId, present };
  }

  // Alarm Management
  async getAlarms(userId: string): Promise<Alarm[]> {
    return await this.client.getAlarms(userId);
  }

  async setAlarm(userId: string, time: string, daysOfWeek: number[], vibration: boolean = true, sound?: string): Promise<Alarm> {
    return await this.client.setAlarm(userId, {
      time,
      daysOfWeek,
      vibration,
      sound,
      enabled: true
    });
  }

  async updateAlarm(userId: string, alarmId: string, updates: Partial<Alarm>): Promise<Alarm> {
    return await this.client.updateAlarm(userId, alarmId, updates);
  }

  async deleteAlarm(userId: string, alarmId: string): Promise<void> {
    await this.client.deleteAlarm(userId, alarmId);
  }

  // Device Control
  async getDeviceStatus(userId: string): Promise<DeviceStatus> {
    return await this.client.getDeviceStatus(userId);
  }

  async setDevicePower(userId: string, on: boolean): Promise<void> {
    await this.client.setDevicePower(userId, on);
  }

  // Additional Sleep Data
  async getRespiratoryRate(userId: string, date: string): Promise<number> {
    return await this.client.getRespiratoryRate(userId, date);
  }

  async getHeartRate(userId: string, date: string): Promise<{
    average: number;
    min: number;
    max: number;
  }> {
    return await this.client.getHeartRate(userId, date);
  }

  async getSleepTiming(userId: string, date: string): Promise<{
    bedtime: string;
    waketime: string;
    duration: number;
  }> {
    return await this.client.getSleepTiming(userId, date);
  }

  async getSleepFitnessTrends(userId: string, days: number = 7): Promise<{
    date: string;
    score: number;
  }[]> {
    return await this.client.getSleepFitnessTrends(userId, days);
  }

  // Temperature Scheduling
  async getTemperatureSchedules(userId: string): Promise<TemperatureSchedule[]> {
    return await this.client.getTemperatureSchedules(userId);
  }

  async setTemperatureSchedule(
    userId: string,
    startTime: string,
    level: number,
    daysOfWeek: number[]
  ): Promise<TemperatureSchedule> {
    return await this.client.setTemperatureSchedule(userId, {
      startTime,
      level,
      daysOfWeek,
      enabled: true
    });
  }

  async updateTemperatureSchedule(
    userId: string,
    scheduleId: string,
    updates: Partial<TemperatureSchedule>
  ): Promise<TemperatureSchedule> {
    return await this.client.updateTemperatureSchedule(userId, scheduleId, updates);
  }

  async deleteTemperatureSchedule(userId: string, scheduleId: string): Promise<void> {
    await this.client.deleteTemperatureSchedule(userId, scheduleId);
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    return await this.client.getUserPreferences(userId);
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    return await this.client.updateUserPreferences(userId, preferences);
  }
}

// MCP function definitions
export const FUNCTIONS: Record<string, FunctionSchema> = {
  getUsers: {
    name: 'getUsers',
    description: 'Get a list of connected Eight Sleep users',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  getTemperature: {
    name: 'getTemperature',
    description: 'Get current temperature settings for the configured user',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  setTemperature: {
    name: 'setTemperature',
    description: 'Set temperature for the configured user',
    parameters: {
      type: 'object',
      properties: {
        level: {
          type: 'integer',
          description: 'Temperature level (-100 to 100)',
          minimum: -100,
          maximum: 100
        },
        duration: {
          type: 'integer',
          description: 'Duration in seconds (0 for indefinite)',
          default: 0
        }
      },
      required: ['level']
    }
  },
  getSleepData: {
    name: 'getSleepData',
    description: 'Get sleep data for the configured user within a date range',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format'
        },
        endDate: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional)'
        }
      },
      required: ['startDate']
    }
  },
  getHrv: {
    name: 'getHrv',
    description: 'Get HRV (Heart Rate Variability) data for a specific date',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format'
        }
      },
      required: ['date']
    }
  },
  getSleepScore: {
    name: 'getSleepScore',
    description: 'Get sleep score data for a specific date',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format'
        }
      },
      required: ['date']
    }
  },
  getSleepStages: {
    name: 'getSleepStages',
    description: 'Get sleep stages data for a specific date',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format'
        }
      },
      required: ['date']
    }
  },
  getPresence: {
    name: 'getPresence',
    description: 'Check if the configured user is currently in bed',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  // Alarm Management
  getAlarms: {
    name: 'getAlarms',
    description: 'Get all alarms for the configured user',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  setAlarm: {
    name: 'setAlarm',
    description: 'Create a new alarm for the configured user',
    parameters: {
      type: 'object',
      properties: {
        time: {
          type: 'string',
          description: 'Alarm time in HH:mm format'
        },
        daysOfWeek: {
          type: 'array',
          items: {
            type: 'integer',
            minimum: 0,
            maximum: 6
          },
          description: 'Days of week (0 = Sunday, 6 = Saturday)'
        },
        vibration: {
          type: 'boolean',
          description: 'Whether to use vibration',
          default: true
        },
        sound: {
          type: 'string',
          description: 'Sound to use for the alarm (optional)'
        }
      },
      required: ['time', 'daysOfWeek']
    }
  },
  updateAlarm: {
    name: 'updateAlarm',
    description: 'Update an existing alarm',
    parameters: {
      type: 'object',
      properties: {
        alarmId: {
          type: 'string',
          description: 'ID of the alarm to update'
        },
        enabled: {
          type: 'boolean',
          description: 'Whether the alarm is enabled'
        },
        time: {
          type: 'string',
          description: 'Alarm time in HH:mm format'
        },
        daysOfWeek: {
          type: 'array',
          items: {
            type: 'integer',
            minimum: 0,
            maximum: 6
          },
          description: 'Days of week (0 = Sunday, 6 = Saturday)'
        },
        vibration: {
          type: 'boolean',
          description: 'Whether to use vibration'
        }
      },
      required: ['alarmId']
    }
  },
  deleteAlarm: {
    name: 'deleteAlarm',
    description: 'Delete an alarm',
    parameters: {
      type: 'object',
      properties: {
        alarmId: {
          type: 'string',
          description: 'ID of the alarm to delete'
        }
      },
      required: ['alarmId']
    }
  },
  // Device Control
  getDeviceStatus: {
    name: 'getDeviceStatus',
    description: 'Get the current status of the Eight Sleep device',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  setDevicePower: {
    name: 'setDevicePower',
    description: 'Turn the Eight Sleep device on or off',
    parameters: {
      type: 'object',
      properties: {
        on: {
          type: 'boolean',
          description: 'Whether to turn the device on (true) or off (false)'
        }
      },
      required: ['on']
    }
  },
  // Additional Sleep Data
  getRespiratoryRate: {
    name: 'getRespiratoryRate',
    description: 'Get respiratory rate data for a specific date',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format'
        }
      },
      required: ['date']
    }
  },
  getHeartRate: {
    name: 'getHeartRate',
    description: 'Get heart rate data for a specific date',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format'
        }
      },
      required: ['date']
    }
  },
  getSleepTiming: {
    name: 'getSleepTiming',
    description: 'Get sleep timing data (bedtime and wake time) for a specific date',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format'
        }
      },
      required: ['date']
    }
  },
  getSleepFitnessTrends: {
    name: 'getSleepFitnessTrends',
    description: 'Get sleep fitness trends over a period of days',
    parameters: {
      type: 'object',
      properties: {
        days: {
          type: 'integer',
          description: 'Number of days to get trends for',
          minimum: 1,
          default: 7
        }
      },
      required: []
    }
  },
  // Temperature Scheduling
  getTemperatureSchedules: {
    name: 'getTemperatureSchedules',
    description: 'Get all temperature schedules for the configured user',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  setTemperatureSchedule: {
    name: 'setTemperatureSchedule',
    description: 'Create a new temperature schedule',
    parameters: {
      type: 'object',
      properties: {
        startTime: {
          type: 'string',
          description: 'Schedule start time in HH:mm format'
        },
        level: {
          type: 'integer',
          description: 'Temperature level (-100 to 100)',
          minimum: -100,
          maximum: 100
        },
        daysOfWeek: {
          type: 'array',
          items: {
            type: 'integer',
            minimum: 0,
            maximum: 6
          },
          description: 'Days of week (0 = Sunday, 6 = Saturday)'
        }
      },
      required: ['startTime', 'level', 'daysOfWeek']
    }
  },
  updateTemperatureSchedule: {
    name: 'updateTemperatureSchedule',
    description: 'Update an existing temperature schedule',
    parameters: {
      type: 'object',
      properties: {
        scheduleId: {
          type: 'string',
          description: 'ID of the schedule to update'
        },
        startTime: {
          type: 'string',
          description: 'Schedule start time in HH:mm format'
        },
        level: {
          type: 'integer',
          description: 'Temperature level (-100 to 100)',
          minimum: -100,
          maximum: 100
        },
        daysOfWeek: {
          type: 'array',
          items: {
            type: 'integer',
            minimum: 0,
            maximum: 6
          },
          description: 'Days of week (0 = Sunday, 6 = Saturday)'
        },
        enabled: {
          type: 'boolean',
          description: 'Whether the schedule is enabled'
        }
      },
      required: ['scheduleId']
    }
  },
  deleteTemperatureSchedule: {
    name: 'deleteTemperatureSchedule',
    description: 'Delete a temperature schedule',
    parameters: {
      type: 'object',
      properties: {
        scheduleId: {
          type: 'string',
          description: 'ID of the schedule to delete'
        }
      },
      required: ['scheduleId']
    }
  },
  // User Preferences
  getUserPreferences: {
    name: 'getUserPreferences',
    description: 'Get user preferences',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  updateUserPreferences: {
    name: 'updateUserPreferences',
    description: 'Update user preferences',
    parameters: {
      type: 'object',
      properties: {
        units: {
          type: 'string',
          enum: ['imperial', 'metric'],
          description: 'Preferred units system'
        },
        timezone: {
          type: 'string',
          description: 'Preferred timezone'
        },
        bedSide: {
          type: 'string',
          enum: ['left', 'right', ''],
          description: 'Preferred side of the bed'
        },
        sleepGoal: {
          type: 'integer',
          description: 'Sleep goal in minutes',
          minimum: 0
        }
      },
      required: []
    }
  }
}; 