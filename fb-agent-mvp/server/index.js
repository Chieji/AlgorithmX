/**
 * AlgorithmX v0.0.1
 * Component: Backend Interpreter & Scheduler
 * Description: AI-powered Facebook automation backend with brutal error handling
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const schedule = require('node-schedule');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// In-memory task queue
let taskQueue = [];
let genAI = null;
let model = null;

// Custom error types
class APIKeyError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'APIKeyError';
    this.statusCode = 401;
  }
}

class ValidationError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class GeminiError extends Error {
  constructor(msg, original) {
    super(msg);
    this.name = 'GeminiError';
    this.statusCode = 502;
    this.originalError = original;
  }
}

class TimeoutError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'TimeoutError';
    this.statusCode = 504;
  }
}

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Request timeout middleware
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    const err = new TimeoutError('Request timeout after 30s');
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      type: 'TimeoutError',
      timestamp: new Date().toISOString()
    });
  });
  next();
});

// Middleware to initialize Gemini with API key from header or env
function initializeGemini(apiKey) {
    if (!apiKey || apiKey.trim() === '') {
        throw new APIKeyError('API key is missing or empty. Provide via X-API-Key header or GEMINI_API_KEY env.');
    }
    
    if (apiKey.length < 20) {
        throw new APIKeyError('API key appears invalid (too short). Check your key from ai.google.dev');
    }
    
    try {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    } catch (error) {
        throw new GeminiError('Failed to initialize Gemini. Check API key validity.', error);
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    try {
        const hasKey = !!(process.env.GEMINI_API_KEY || req.headers['x-api-key']);
        res.json({ 
            status: 'healthy',
            service: 'AlgorithmX Backend v0.0.1',
            hasApiKey: hasKey,
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        console.error('[HEALTH] Unexpected error:', error);
        res.status(500).json({ 
            status: 'error',
            error: 'Health check failed',
            timestamp: new Date().toISOString()
        });
    }
});

// 1. Interpret Intent
app.post('/interpret', async (req, res) => {
    const requestId = Math.random().toString(36).substr(2, 9);
    const startTime = Date.now();
    
    try {
        const { command } = req.body;
        const apiKey = req.headers['x-api-key'] || process.env.GEMINI_API_KEY;

        console.log(`[${requestId}] POST /interpret - Command: "${command?.substring(0, 50)}..."`);

        // Validate API key
        if (!apiKey) {
            throw new APIKeyError('X-API-Key header or GEMINI_API_KEY env required');
        }

        // Validate command
        if (!command || typeof command !== 'string' || command.trim() === '') {
            throw new ValidationError('Command is required and must be a non-empty string');
        }

        if (command.length > 5000) {
            throw new ValidationError('Command is too long (max 5000 characters)');
        }

        // Initialize Gemini
        try {
            initializeGemini(apiKey);
        } catch (error) {
            if (error instanceof APIKeyError || error instanceof GeminiError) {
                throw error;
            }
            throw new GeminiError('Failed to initialize Gemini API', error);
        }

        // Build prompt
        const prompt = `
            Current Time: ${new Date().toISOString()}
            User Command: "${command}"
            
            Analyze intent. Return ONLY valid JSON (no markdown, no code blocks):
            {
                "action": "create_post",
                "content": "string",
                "schedule_time": "ISO_STRING or null", 
                "backdate_date": "YYYY-MM-DD or null",
                "confidence": 0.0 to 1.0
            }
        `;

        // Call Gemini with timeout
        let result;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000);
            
            result = await Promise.race([
                model.generateContent(prompt),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new TimeoutError('Gemini API response timeout')), 25000)
                )
            ]);
            
            clearTimeout(timeoutId);
        } catch (error) {
            if (error instanceof TimeoutError) {
                throw error;
            }
            throw new GeminiError('Gemini API call failed. Check your API key and quota.', error);
        }

        // Parse response
        let text;
        try {
            text = result.response?.text?.();
            if (!text) {
                throw new GeminiError('Gemini returned empty response', null);
            }
        } catch (error) {
            throw new GeminiError('Failed to extract Gemini response', error);
        }

        // Sanitize and parse JSON
        let intent;
        try {
            const cleanText = text.replace(/```json|```/g, '').trim();
            intent = JSON.parse(cleanText);
        } catch (error) {
            console.error(`[${requestId}] JSON parse failed:`, text);
            throw new ValidationError(`Gemini returned invalid JSON. Raw: ${text.substring(0, 100)}`);
        }

        // Validate intent structure
        try {
            if (!intent.action || !intent.content) {
                throw new ValidationError('Intent missing required fields: action, content');
            }
            if (typeof intent.content !== 'string') {
                throw new ValidationError('Intent content must be a string');
            }
            if (intent.content.trim() === '') {
                throw new ValidationError('Intent content cannot be empty');
            }
        } catch (error) {
            if (error instanceof ValidationError) throw error;
            throw new ValidationError('Intent structure validation failed', error);
        }

        // Handle scheduling
        if (intent.schedule_time) {
            try {
                const scheduleDate = new Date(intent.schedule_time);
                if (isNaN(scheduleDate.getTime())) {
                    throw new ValidationError('Invalid schedule_time format');
                }
                if (scheduleDate < new Date()) {
                    throw new ValidationError('Scheduled time cannot be in the past');
                }

                console.log(`[${requestId}] Scheduled for ${scheduleDate.toISOString()}`);
                
                schedule.scheduleJob(scheduleDate, () => {
                    console.log(`[${requestId}] Executing scheduled task: ${intent.content}`);
                    taskQueue.push(intent);
                });

                const elapsed = Date.now() - startTime;
                return res.json({ 
                    success: true, 
                    message: `Scheduled for ${scheduleDate.toLocaleString()}`, 
                    type: 'SCHEDULED',
                    intent,
                    requestId,
                    elapsed: `${elapsed}ms`
                });
            } catch (error) {
                if (error instanceof ValidationError) throw error;
                throw new ValidationError('Scheduling failed: ' + error.message);
            }
        }

        // Immediate execution
        const elapsed = Date.now() - startTime;
        res.json({ 
            success: true, 
            intent, 
            type: 'IMMEDIATE',
            requestId,
            elapsed: `${elapsed}ms`
        });

    } catch (error) {
        const elapsed = Date.now() - startTime;
        
        // Log full error for debugging
        console.error(`[${requestId}] ERROR (${error.name}):`, {
            message: error.message,
            stack: error.stack,
            statusCode: error.statusCode || 500,
            elapsed: `${elapsed}ms`
        });

        // Send appropriate error response
        const statusCode = error.statusCode || 500;
        const response = {
            success: false,
            error: error.message,
            type: error.name,
            requestId,
            elapsed: `${elapsed}ms`,
            timestamp: new Date().toISOString()
        };

        res.status(statusCode).json(response);
    }
});

// 2. Poll Endpoint
app.get('/tasks', (req, res) => {
    try {
        if (taskQueue.length > 0) {
            const task = taskQueue.shift();
            res.json({ hasTask: true, task });
        } else {
            res.json({ hasTask: false });
        }
    } catch (error) {
        console.error('[TASKS] Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to retrieve tasks'
        });
    }
});

// 3. Status endpoint
app.get('/status', (req, res) => {
    try {
        res.json({ 
            service: 'AlgorithmX v0.0.1',
            queueLength: taskQueue.length,
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        console.error('[STATUS] Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to retrieve status'
        });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('[GLOBAL ERROR]:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
    });

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: err.message || 'Internal server error',
        type: err.name || 'UnknownError',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Endpoint not found: ${req.method} ${req.path}`,
        availableEndpoints: [
            'GET /health',
            'GET /status',
            'GET /tasks',
            'POST /interpret'
        ]
    });
});

// Graceful startup
const server = app.listen(port, () => {
    console.log(`
╔════════════════════════════════════════════════════╗
║  AlgorithmX v0.0.1 - Backend Server                ║
║  Status: ✅ Running                                 ║
║  Port: ${port}                                          ║
║  Time: ${new Date().toLocaleString()}                ║
║  PID: ${process.pid}                                      ║
╚════════════════════════════════════════════════════╝
    `);
    console.log('✓ Waiting for extension connection...');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[SHUTDOWN] SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('[SHUTDOWN] Server closed');
        process.exit(0);
    });
    setTimeout(() => {
        console.error('[SHUTDOWN] Forced exit after 10s');
        process.exit(1);
    }, 10000);
});

process.on('SIGTERM', () => {
    console.log('\n[SHUTDOWN] SIGTERM received. Shutting down...');
    server.close(() => {
        console.log('[SHUTDOWN] Server closed');
        process.exit(0);
    });
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
    console.error('[UNHANDLED REJECTION]:', {
        reason,
        promise: promise.toString(),
        timestamp: new Date().toISOString()
    });
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
    console.error('[UNCAUGHT EXCEPTION]:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
    process.exit(1);
});
