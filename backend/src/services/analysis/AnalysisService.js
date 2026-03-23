const Cleaner = require('./Cleaner');
const Metrics = require('./Metrics');
const Aggregator = require('./Aggregator');
const AIOrchestrator = require('./AIOrchestrator');
const AnalysisCacheService = require('./AnalysisCacheService');

/**
 * AnalysisService (Domain Service)
 * Responsibility: Orchestrate the 4-stage elite pipeline with semantic caching.
 * Note: Pure business logic orchestration, infrastructure (DB) is delegated to CacheService.
 */
class AnalysisService {
    static async getFullAnalysis(userId, rawMatches) {
        // Stage 1: Clean
        const cleanMatches = Cleaner.sanitize(rawMatches);
        
        // Stage 2: Metrics
        const metrics = Metrics.calculate(cleanMatches);
        
        // Stage 3: Aggregate (Scenario & Flags)
        const { scenario, flags } = Aggregator.aggregate(metrics, cleanMatches);
        
        // Stage 4: AI & Semantic Cache
        const inputSignature = {
            metrics_hash: { win_rate: metrics.win_rate, diff: metrics.avg_point_diff },
            scenario_id: scenario.id,
            flags: flags.map(f => f.id).sort()
        };
        const hash = AIOrchestrator.generateHash(inputSignature);

        // Delegation to Cache Service
        let narrative = await AnalysisCacheService.get(userId, hash);

        if (narrative) {
            console.log(`[ANALYSIS SERVICE] Cache Hit! Hash: ${hash}`);
        } else {
            console.log(`[ANALYSIS SERVICE] Cache Miss. Calling AI... Hash: ${hash}`);
            narrative = await AIOrchestrator.callLLM(metrics, scenario, flags);
            
            // Persist via Cache Service
            await AnalysisCacheService.set(userId, hash, metrics.confidence, narrative);
        }

        return {
            metrics,
            scenario,
            flags,
            narrative,
            confidence: metrics.confidence,
            hash
        };
    }
}

module.exports = AnalysisService;
