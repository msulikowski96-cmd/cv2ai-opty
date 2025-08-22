import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Sparkles, Search, FileText, User, Crown, Lock } from "lucide-react";

interface CvAnalyzerProps {
  cvUploadId: string;
  onBack: () => void;
  userPlan: 'free' | 'basic' | 'premium';
}

interface AnalysisFeature {
  id: string;
  name: string;
  description: string;
  icon: any;
  requiredPlan: 'free' | 'basic' | 'premium';
  color: string;
}

export default function CvAnalyzer({ cvUploadId, onBack, userPlan }: CvAnalyzerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [jobDescription, setJobDescription] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  const analysisFeatures: AnalysisFeature[] = [
    {
      id: 'optimize_cv',
      name: 'CV Optimization',
      description: 'AI-powered optimization of your CV content for better impact',
      icon: Sparkles,
      requiredPlan: 'basic',
      color: 'text-primary-500'
    },
    {
      id: 'ats_optimization_check',
      name: 'ATS Compatibility',
      description: 'Check how well your CV works with Applicant Tracking Systems',
      icon: Search,
      requiredPlan: 'basic',
      color: 'text-blue-500'
    },
    {
      id: 'grammar_check',
      name: 'Grammar & Style',
      description: 'Advanced grammar and style checking for Polish language',
      icon: FileText,
      requiredPlan: 'basic',
      color: 'text-green-500'
    },
    {
      id: 'recruiter_feedback',
      name: 'Recruiter Feedback',
      description: 'Get detailed feedback from a recruiter\'s perspective',
      icon: User,
      requiredPlan: 'premium',
      color: 'text-orange-500'
    },
    {
      id: 'cover_letter',
      name: 'Cover Letter Generator',
      description: 'Generate personalized cover letters matched to job descriptions',
      icon: FileText,
      requiredPlan: 'premium',
      color: 'text-purple-500'
    },
    {
      id: 'interview_questions',
      name: 'Interview Preparation',
      description: 'Get potential interview questions based on your CV and job description',
      icon: User,
      requiredPlan: 'premium',
      color: 'text-teal-500'
    }
  ];

  const analysisMutation = useMutation({
    mutationFn: async ({ analysisType, jobDesc }: { analysisType: string; jobDesc: string }) => {
      const response = await apiRequest('POST', '/api/analyze-cv', {
        cvUploadId,
        analysisType,
        jobDescription: jobDesc
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      setResults(prev => ({
        ...prev,
        [variables.analysisType]: data.result
      }));
      toast({
        title: "Analysis Complete",
        description: "Your CV analysis has been completed successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/usage-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnalysis = (analysisType: string) => {
    if (canUseFeature(analysisType)) {
      setSelectedAnalysis(analysisType);
      analysisMutation.mutate({ analysisType, jobDesc: jobDescription });
    }
  };

  const canUseFeature = (featureId: string) => {
    const feature = analysisFeatures.find(f => f.id === featureId);
    if (!feature) return false;
    
    switch (feature.requiredPlan) {
      case 'free':
        return true;
      case 'basic':
        return userPlan === 'basic' || userPlan === 'premium';
      case 'premium':
        return userPlan === 'premium';
      default:
        return false;
    }
  };

  const getPlanBadge = (requiredPlan: string) => {
    switch (requiredPlan) {
      case 'basic':
        return <Badge variant="secondary">Basic</Badge>;
      case 'premium':
        return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">Premium</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={onBack}
            data-testid="button-back-analyzer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">CV Analysis</h2>
        </div>
        <Badge variant="outline" className="capitalize">
          {userPlan} Plan
        </Badge>
      </div>

      {/* Job Description Input */}
      <Card>
        <CardHeader>
          <CardTitle>Job Description (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="job-desc">
              Paste the job description to get targeted analysis
            </Label>
            <Textarea
              id="job-desc"
              placeholder="Paste the job description here for more accurate analysis..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={4}
              data-testid="textarea-job-description-analyzer"
            />
          </div>
        </CardContent>
      </Card>

      {/* Analysis Features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analysisFeatures.map((feature) => {
          const IconComponent = feature.icon;
          const canUse = canUseFeature(feature.id);
          const isAnalyzing = analysisMutation.isPending && selectedAnalysis === feature.id;
          const hasResult = results[feature.id];

          return (
            <Card 
              key={feature.id} 
              className={`relative transition-all duration-300 ${
                canUse ? 'cursor-pointer hover:shadow-lg' : 'opacity-60'
              } ${hasResult ? 'border-green-500/50 bg-green-500/5' : ''}`}
              onClick={() => canUse && !isAnalyzing && handleAnalysis(feature.id)}
              data-testid={`analysis-feature-${feature.id}`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color}/20 flex items-center justify-center`}>
                    <IconComponent className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {getPlanBadge(feature.requiredPlan)}
                    {!canUse && <Lock className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
                <CardTitle className="text-lg">{feature.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {feature.description}
                </p>
                
                {canUse ? (
                  <Button 
                    className="w-full" 
                    disabled={isAnalyzing}
                    variant={hasResult ? "outline" : "default"}
                    data-testid={`button-analyze-${feature.id}`}
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                        Analyzing...
                      </>
                    ) : hasResult ? (
                      'Analyze Again'
                    ) : (
                      'Start Analysis'
                    )}
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    disabled
                    variant="outline"
                  >
                    {feature.requiredPlan === 'premium' ? (
                      <>
                        <Crown className="w-4 h-4 mr-2" />
                        Premium Required
                      </>
                    ) : (
                      'Basic Required'
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Results Section */}
      {Object.keys(results).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(results).map(([analysisType, result]) => {
                const feature = analysisFeatures.find(f => f.id === analysisType);
                if (!feature) return null;

                return (
                  <div key={analysisType} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <feature.icon className={`w-5 h-5 ${feature.color}`} />
                      <h4 className="font-semibold">{feature.name}</h4>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{result}</pre>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
