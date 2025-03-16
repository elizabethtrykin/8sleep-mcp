import { jest } from '@jest/globals';
import axios from 'axios';
import { EightSleepFunctions } from '../functions.js';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('EightSleepFunctions', () => {
  let eightFunctions: EightSleepFunctions;

  beforeEach(() => {
    eightFunctions = new EightSleepFunctions();
    // Reset all mocks
    jest.clearAllMocks();
    // Setup default axios.create mock
    mockedAxios.create.mockReturnValue(mockedAxios);
  });

  describe('getUsers', () => {
    it('should fetch users successfully', async () => {
      const mockUsers = {
        'user1': { id: 'user1', name: 'Test User' }
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockUsers });

      const result = await eightFunctions.getUsers();
      expect(result).toEqual(mockUsers);
      expect(mockedAxios.get).toHaveBeenCalledWith('/users');
    });
  });

  describe('getTemperature', () => {
    it('should fetch temperature data successfully', async () => {
      const mockTemp = {
        current: 72,
        target: 70,
        heating: false,
        cooling: true
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockTemp });

      const result = await eightFunctions.getTemperature('user1');
      expect(result).toEqual(mockTemp);
      expect(mockedAxios.get).toHaveBeenCalledWith('/temperature/user1');
    });
  });

  describe('setTemperature', () => {
    it('should set temperature successfully', async () => {
      const mockResponse = { message: 'Temperature updated successfully' };

      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await eightFunctions.setTemperature('user1', 75);
      expect(result).toEqual(mockResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/temperature/user1/set',
        null,
        { params: { level: 75, duration: 0 } }
      );
    });

    it('should throw error for invalid temperature', async () => {
      await expect(eightFunctions.setTemperature('user1', 150))
        .rejects
        .toThrow('Temperature level must be between -100 and 100');
    });
  });

  describe('getSleepData', () => {
    it('should fetch sleep data successfully', async () => {
      const mockSleepData = [{
        userId: 'user1',
        date: '2024-03-08',
        stages: { deep: 120, light: 240 }
      }];

      mockedAxios.get.mockResolvedValueOnce({ data: mockSleepData });

      const result = await eightFunctions.getSleepData('user1', '2024-03-08');
      expect(result).toEqual(mockSleepData);
      expect(mockedAxios.get).toHaveBeenCalledWith('/sleep/user1', {
        params: { start_date: '2024-03-08' }
      });
    });

    it('should include end date when provided', async () => {
      const mockSleepData = [{
        userId: 'user1',
        date: '2024-03-08',
        stages: { deep: 120, light: 240 }
      }];

      mockedAxios.get.mockResolvedValueOnce({ data: mockSleepData });

      await eightFunctions.getSleepData('user1', '2024-03-08', '2024-03-09');
      expect(mockedAxios.get).toHaveBeenCalledWith('/sleep/user1', {
        params: { start_date: '2024-03-08', end_date: '2024-03-09' }
      });
    });
  });
}); 