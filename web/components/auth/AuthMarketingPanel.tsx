'use client';

import { TrendingUp, Users, BarChart3, Zap, Check } from 'lucide-react';

export function AuthMarketingPanel() {
  return (
    <div className="hidden md:flex flex-col justify-center bg-white w-full h-full p-4 lg:p-6 rounded-lg">
      <div className="max-w-lg space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Transform Earnings Calls into Visual Insights
          </h2>
          <p className="text-text-secondary">
            Join thousands analyzing earnings calls with AI-powered insights and interactive data visualization.
          </p>
        </div>

        {/* Use Cases */}
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-1">Investment Research</h4>
              <p className="text-sm text-text-secondary">
                Analyze 7,600+ companies with synchronized audio, transcripts, and financial metrics.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-1">Financial Analysis</h4>
              <p className="text-sm text-text-secondary">
                Interactive charts with quarterly comparisons and trend analysis.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-1">Team Collaboration</h4>
              <p className="text-sm text-text-secondary">
                Share watchlists and research with your team. Collaborate on earnings analysis.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-1">AI-Powered Insights</h4>
              <p className="text-sm text-text-secondary">
                Automatic highlights, key metrics extraction, and sentiment analysis.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-background-elevated border border-border rounded-lg p-4">
          <h3 className="font-bold text-text-primary mb-3 text-sm">What You Get</h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
              <span>Watch 50% of every earnings call for free</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
              <span>Browse all 7,600+ companies</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
              <span>View basic financial charts</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-accent flex-shrink-0" />
              <span className="text-primary font-medium">Upgrade to Pro for full access</span>
            </li>
          </ul>
        </div>

        {/* Pricing Teaser */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h3 className="font-bold text-text-primary mb-2 text-sm">Simple Pricing</h3>
          <p className="text-xs text-text-secondary mb-2">
            Pro: $29/month • Team: $99/month
          </p>
          <p className="text-xs text-primary font-medium">
            7-day money-back guarantee • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
