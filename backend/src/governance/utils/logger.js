const winston = require('winston');
const path = require('path');

/**
 * SPIN4ALL - Governance Logger 10.1
 * Sistema de logs estruturados para auditoria industrial de ações do agente.
 */

const governanceLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { 
        service: 'TICO',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        // Logs de erro separados para triagem rápida
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/governance-error.log'), 
            level: 'error' 
        }),
        // Log completo de auditoria
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/governance.log') 
        }),
        // Saída em console colorida para desenvolvimento
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, executionId, ...meta }) => {
                    const execInfo = executionId ? ` [ExecID: ${executionId}]` : '';
                    return `${timestamp} [${level}]${execInfo}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
                })
            )
        })
    ]
});

module.exports = governanceLogger;
