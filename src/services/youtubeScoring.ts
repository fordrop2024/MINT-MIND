/**
 * CREOVA YouTube Intelligence - Analytical Scoring Architecture
 *
 * NOTE: These are CREOVA internal proprietary analytical scores and
 * mathematical models. They are NOT official YouTube platform metrics.
 *
 * Once the YouTube Data API is connected, these functions will evaluate
 * normalized channel and video historical metrics.
 */

export interface ScoreBreakdown {
  score: number; // 0 to 100
  rating: 'Exceptional' | 'High' | 'Moderate' | 'Low' | 'Needs Optimization';
  confidence: number; // 0 to 1
  factors: Record<string, number>;
  disclaimer: string;
}

const SCORE_DISCLAIMER = 'CREOVA Internal Analytical Score. Not an official YouTube metric.';

/**
 * Calculates a channel's momentum and subscriber/view acceleration.
 * Formula balances velocity (recent 30d views) and conversion rate (subs per 1,000 views).
 */
export function growthScore(
  subGrowthRate30d: number,
  viewVelocity30d: number,
  uploadConsistencyRatio: number = 1.0
): ScoreBreakdown {
  if (subGrowthRate30d <= 0 && viewVelocity30d <= 0) {
    return {
      score: 0,
      rating: 'Needs Optimization',
      confidence: 0,
      factors: { subGrowth: 0, viewVelocity: 0, consistency: 0 },
      disclaimer: SCORE_DISCLAIMER,
    };
  }

  // Normalized weighted model
  const subComponent = Math.min(Math.max(subGrowthRate30d * 2.5, 0), 40);
  const viewComponent = Math.min(Math.max(viewVelocity30d * 1.5, 0), 40);
  const consistencyComponent = Math.min(uploadConsistencyRatio * 20, 20);

  const rawScore = subComponent + viewComponent + consistencyComponent;
  const score = Math.round(Math.min(Math.max(rawScore, 0), 100));

  return {
    score,
    rating: getRating(score),
    confidence: 0.85,
    factors: {
      subGrowth: Math.round(subComponent),
      viewVelocity: Math.round(viewComponent),
      consistency: Math.round(consistencyComponent),
    },
    disclaimer: SCORE_DISCLAIMER,
  };
}

/**
 * Calculates audience engagement depth based on like-to-view and comment-to-view ratios.
 * High-effort engagement (comments) is weighted 3x higher than passive actions (likes).
 */
export function engagementScore(
  likes: number,
  comments: number,
  views: number
): ScoreBreakdown {
  if (views <= 0) {
    return {
      score: 0,
      rating: 'Needs Optimization',
      confidence: 0,
      factors: { likeRatio: 0, commentRatio: 0 },
      disclaimer: SCORE_DISCLAIMER,
    };
  }

  const likeRatio = (likes / views) * 100; // Benchmark: ~4% is typical
  const commentRatio = (comments / views) * 100; // Benchmark: ~0.5% is typical

  // Standard benchmark scoring
  const likeComponent = Math.min((likeRatio / 6) * 50, 50);
  const commentComponent = Math.min((commentRatio / 0.8) * 50, 50);

  const score = Math.round(Math.min(likeComponent + commentComponent, 100));

  return {
    score,
    rating: getRating(score),
    confidence: 0.9,
    factors: {
      likeRatio: Number(likeRatio.toFixed(2)),
      commentRatio: Number(commentRatio.toFixed(2)),
    },
    disclaimer: SCORE_DISCLAIMER,
  };
}

/**
 * Evaluates a single video's relative performance against its parent channel's baseline.
 */
export function performanceScore(
  views: number,
  channelAvgViews: number,
  engagementRatePercent: number
): ScoreBreakdown {
  if (channelAvgViews <= 0) {
    return {
      score: 0,
      rating: 'Needs Optimization',
      confidence: 0,
      factors: { multiplier: 0, engagementRate: 0 },
      disclaimer: SCORE_DISCLAIMER,
    };
  }

  const multiplier = views / channelAvgViews;
  // Multiplier mapping: 1x = 50, 2x = 75, 4x+ = 95+
  const multiplierScore = Math.min(Math.max((Math.log2(multiplier + 0.5) + 1) * 35, 0), 70);
  const engagementComponent = Math.min((engagementRatePercent / 8) * 30, 30);

  const score = Math.round(Math.min(multiplierScore + engagementComponent, 100));

  return {
    score,
    rating: getRating(score),
    confidence: 0.88,
    factors: {
      multiplier: Number(multiplier.toFixed(2)),
      engagementContribution: Math.round(engagementComponent),
    },
    disclaimer: SCORE_DISCLAIMER,
  };
}

/**
 * Detects whether a video qualifies as a breakthrough statistical outlier.
 * Evaluates deviation from median views with penalty for very recent uploads.
 */
export function outlierScore(
  videoViews: number,
  channelBaselineAvg: number,
  daysSincePublished: number
): ScoreBreakdown {
  if (channelBaselineAvg <= 0 || videoViews <= 0) {
    return {
      score: 0,
      rating: 'Needs Optimization',
      confidence: 0,
      factors: { multiplier: 0, velocity: 0 },
      disclaimer: SCORE_DISCLAIMER,
    };
  }

  const multiplier = videoViews / channelBaselineAvg;
  // Outliers generally require >= 2.5x normal channel baseline
  const baseOutlierScore = multiplier >= 2.5 ? Math.min(50 + (multiplier - 2.5) * 15, 100) : multiplier * 20;

  // Velocity boost if achieved in fewer days
  const timeWeight = daysSincePublished > 0 ? Math.max(1.5 - daysSincePublished * 0.02, 0.8) : 1;
  const score = Math.round(Math.min(baseOutlierScore * timeWeight, 100));

  return {
    score,
    rating: getRating(score),
    confidence: 0.82,
    factors: {
      multiplier: Number(multiplier.toFixed(2)),
      daysElapsed: daysSincePublished,
    },
    disclaimer: SCORE_DISCLAIMER,
  };
}

/**
 * Calculates topic opportunity score by contrasting audience demand volume
 * against competition saturation and content freshness gap.
 */
export function opportunityScore(
  searchDemandScore: number, // 0-100
  competitionLevelScore: number, // 0-100 (lower is better for creator)
  growthVelocityScore: number // 0-100
): ScoreBreakdown {
  // High demand + low competition + growing velocity = peak opportunity
  const demandWeight = searchDemandScore * 0.45;
  const competitionAdvantage = (100 - competitionLevelScore) * 0.35;
  const velocityWeight = growthVelocityScore * 0.2;

  const score = Math.round(Math.min(demandWeight + competitionAdvantage + velocityWeight, 100));

  return {
    score,
    rating: getRating(score),
    confidence: 0.8,
    factors: {
      demandWeight: Math.round(demandWeight),
      competitionAdvantage: Math.round(competitionAdvantage),
      velocityWeight: Math.round(velocityWeight),
    },
    disclaimer: SCORE_DISCLAIMER,
  };
}

function getRating(score: number): ScoreBreakdown['rating'] {
  if (score >= 85) return 'Exceptional';
  if (score >= 70) return 'High';
  if (score >= 50) return 'Moderate';
  if (score >= 30) return 'Low';
  return 'Needs Optimization';
}
