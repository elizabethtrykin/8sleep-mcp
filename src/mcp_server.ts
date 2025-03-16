import { config as dotenvConfig } from 'dotenv';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { EightSleepFunctions } from './functions.js';
import { config } from './config.js';

dotenvConfig();

async function main() {
    const eightFunctions = new EightSleepFunctions();
    const userId = config.auth.userId;
    
    const server = new McpServer({
        name: "eight-sleep-mcp",
        version: "1.0.0"
    });

    // Define schemas for function parameters
    const temperatureSchema = { 
        level: z.number(),
        duration: z.number().optional()
    };
    const sleepDataSchema = {
        startDate: z.string(),
        endDate: z.string().optional()
    };
    const dateSchema = {
        date: z.string()
    };

    // Add tools
    server.tool('getUsers', {}, async () => ({
        content: [{ type: 'text', text: JSON.stringify(await eightFunctions.getUsers()) }]
    }));

    server.tool('getTemperature', {}, async () => ({
        content: [{ type: 'text', text: JSON.stringify(await eightFunctions.getTemperature(userId)) }]
    }));

    server.tool('setTemperature', temperatureSchema, async (args) => ({
        content: [{ type: 'text', text: JSON.stringify(await eightFunctions.setTemperature(userId, args.level, args.duration)) }]
    }));

    server.tool('getSleepData', sleepDataSchema, async (args) => ({
        content: [{ type: 'text', text: JSON.stringify(await eightFunctions.getSleepData(userId, args.startDate, args.endDate)) }]
    }));

    server.tool('getHrv', dateSchema, async (args) => ({
        content: [{ type: 'text', text: JSON.stringify(await eightFunctions.getHrv(userId, args.date)) }]
    }));

    server.tool('getSleepScore', dateSchema, async (args) => ({
        content: [{ type: 'text', text: JSON.stringify(await eightFunctions.getSleepScore(userId, args.date)) }]
    }));

    server.tool('getSleepStages', dateSchema, async (args) => ({
        content: [{ type: 'text', text: JSON.stringify(await eightFunctions.getSleepStages(userId, args.date)) }]
    }));

    server.tool('getPresence', {}, async () => ({
        content: [{ type: 'text', text: JSON.stringify(await eightFunctions.getPresence(userId)) }]
    }));

    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(error => {
    process.exit(1);
}); 