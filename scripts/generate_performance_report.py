"""
Performance Report Generator
Copyright © 2024 Paksa IT Solutions

Generate weekly performance reports for optimization
"""

from automation.ab_testing import ROIDashboard, ABTestingFramework
from automation.feedback_loop import FeedbackLoop
from datetime import datetime
import json


def generate_performance_report(days: int = 7):
    """Generate comprehensive performance report"""
    
    print("=" * 60)
    print("LUXEBRAIN AI - PERFORMANCE REPORT")
    print(f"Period: Last {days} days")
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    print()
    
    # ROI Metrics
    roi_dashboard = ROIDashboard()
    roi_metrics = roi_dashboard.calculate_ai_roi(days)
    
    print("📊 REVENUE IMPACT")
    print("-" * 60)
    print(f"Total Revenue: ${roi_metrics['total_revenue']:,.2f}")
    print(f"AI-Influenced Revenue: ${roi_metrics['ai_influenced_revenue']:,.2f}")
    print(f"AI Attribution: {roi_metrics['ai_revenue_percentage']:.1f}%")
    print(f"Infrastructure Cost: ${roi_metrics['infrastructure_cost']:,.2f}")
    print(f"Net Profit: ${roi_metrics['net_profit']:,.2f}")
    print(f"ROI: {roi_metrics['roi_percentage']:.1f}%")
    print(f"Status: {roi_metrics['payback_achieved'] and '✅ Profitable' or '⏳ Investment Phase'}")
    print()
    
    # Model Performance
    feedback = FeedbackLoop()
    
    print("🤖 MODEL PERFORMANCE")
    print("-" * 60)
    
    models = ['recommendation_engine', 'pricing_model', 'segmentation']
    for model in models:
        perf = feedback.calculate_model_performance(model, days)
        if perf:
            print(f"\n{model.replace('_', ' ').title()}:")
            print(f"  Impressions: {perf.get('impressions', 0):,.0f}")
            print(f"  Clicks: {perf.get('clicks', 0):,.0f}")
            print(f"  CTR: {perf.get('ctr', 0):.2f}%")
            print(f"  Conversions: {perf.get('conversions', 0):,.0f}")
            print(f"  Conversion Rate: {perf.get('conversion_rate', 0):.2f}%")
            print(f"  Revenue: ${perf.get('revenue', 0):,.2f}")
    
    print()
    
    # A/B Test Results
    print("🧪 A/B TEST RESULTS")
    print("-" * 60)
    
    ab_test = ABTestingFramework()
    experiments = ['recommendation_engine', 'dynamic_pricing', 'personalized_homepage']
    
    for exp in experiments:
        try:
            results = ab_test.calculate_experiment_results(exp, days)
            print(f"\n{exp.replace('_', ' ').title()}:")
            print(f"  Control Revenue: ${results['control']['revenue']:,.2f}")
            print(f"  Treatment Revenue: ${results['treatment']['revenue']:,.2f}")
            print(f"  Revenue Lift: {results['lift']['revenue']:.1f}%")
            print(f"  Conversion Lift: {results['lift']['conversion_rate']:.1f}%")
            print(f"  AOV Lift: {results['lift']['aov']:.1f}%")
        except:
            print(f"\n{exp}: No data available")
    
    print()
    
    # Recommendations
    print("💡 OPTIMIZATION RECOMMENDATIONS")
    print("-" * 60)
    
    recommendations = []
    
    # Check if retraining needed
    for model in models:
        if feedback.check_retraining_needed(model):
            recommendations.append(f"⚠️  Retrain {model} - performance degraded")
    
    # Check ROI
    if roi_metrics['roi_percentage'] < 100:
        recommendations.append("📉 ROI below target - review cost optimization")
    
    # Check CTR
    rec_perf = feedback.calculate_model_performance('recommendation_engine', days)
    if rec_perf and rec_perf.get('ctr', 0) < 3.0:
        recommendations.append("📊 Recommendation CTR low - test different placements")
    
    if recommendations:
        for rec in recommendations:
            print(f"  {rec}")
    else:
        print("  ✅ All systems performing optimally")
    
    print()
    print("=" * 60)
    print("Report saved to: reports/performance_{}.json".format(
        datetime.now().strftime('%Y%m%d_%H%M%S')
    ))
    print("=" * 60)
    
    # Save to file
    report_data = {
        'generated_at': datetime.now().isoformat(),
        'period_days': days,
        'roi_metrics': roi_metrics,
        'model_performance': {
            model: feedback.calculate_model_performance(model, days)
            for model in models
        },
        'recommendations': recommendations
    }
    
    import os
    os.makedirs('reports', exist_ok=True)
    
    filename = f"reports/performance_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, 'w') as f:
        json.dump(report_data, f, indent=2, default=str)


if __name__ == "__main__":
    import sys
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 7
    generate_performance_report(days)
