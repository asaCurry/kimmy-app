import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Crown,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Target,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface UpgradeToPremiumCardProps {
  reason?: string;
  household?: {
    id: string;
    name: string;
    hasAnalyticsAccess: boolean;
  };
}

export const UpgradeToPremiumCard: React.FC<UpgradeToPremiumCardProps> = ({
  reason,
  household,
}) => {
  const premiumFeatures = [
    {
      icon: <BarChart3 className="w-5 h-5 text-blue-400" />,
      title: "Advanced Analytics",
      description: "Detailed insights into your household patterns and trends"
    },
    {
      icon: <Lightbulb className="w-5 h-5 text-yellow-400" />,
      title: "Smart Recommendations",
      description: "AI-powered suggestions to improve your household management"
    },
    {
      icon: <Target className="w-5 h-5 text-green-400" />,
      title: "Pattern Detection",
      description: "Automatically identify trends in health, activities, and growth"
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-purple-400" />,
      title: "Growth Tracking",
      description: "Monitor progress and changes over time with visual charts"
    }
  ];

  return (
    <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/10 border-amber-500/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-500/10 to-transparent rounded-full translate-y-12 -translate-x-12" />
      
      <CardHeader className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 font-medium">
            Premium Feature
          </Badge>
        </div>
        
        <CardTitle className="text-2xl text-amber-400 mb-2">
          Unlock Household Insights
        </CardTitle>
        
        <CardDescription className="text-slate-300 text-base">
          {reason || "Get detailed analytics and smart recommendations for your household management."}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Feature list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {premiumFeatures.map((feature, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
              <div className="flex-shrink-0 mt-0.5">
                {feature.icon}
              </div>
              <div>
                <h4 className="font-medium text-slate-200 mb-1">{feature.title}</h4>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Preview mockup */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-slate-200">Analytics Preview</h4>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-slate-300">Health Records</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">15 records</span>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm text-slate-300">Activities</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">8 records</span>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
            </div>
            
            <div className="pt-2 border-t border-slate-700">
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <Lightbulb className="w-4 h-4" />
                <span>3 recommendations available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            size="lg" 
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 font-medium"
          >
            Upgrade to Premium
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            Learn More
          </Button>
        </div>

        {/* Household info */}
        {household && (
          <div className="pt-4 border-t border-slate-700/50">
            <p className="text-sm text-slate-400">
              Upgrade <span className="text-slate-300 font-medium">{household.name}</span> to access premium analytics features.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};