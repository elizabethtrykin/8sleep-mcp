// Function call types
export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
}

// Function schema types
export interface FunctionParameter {
  type: string;
  description: string;
  minimum?: number;
  maximum?: number;
  default?: any;
  items?: {
    type: string;
    minimum?: number;
    maximum?: number;
  };
  enum?: string[];
}

export interface FunctionSchema {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, FunctionParameter>;
    required: string[];
  };
}

// Eight Sleep data types
export interface User {
  id: string;
  [key: string]: any;
}

export interface TemperatureData {
  current: number;
  target: number;
  heating: boolean;
  cooling: boolean;
  [key: string]: any;
}

export interface SleepData {
  userId: string;
  date: string;
  stages?: {
    [key: string]: any;
  };
  metrics?: {
    [key: string]: any;
  };
  [key: string]: any;
}

// Response types
export interface SuccessResponse {
  message: string;
  [key: string]: any;
}

export interface ErrorResponse {
  status: number;
  detail: string;
} 