import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Download, 
  Eye, 
  Clock,
  Sparkles,
  Search,
  User,
  Crown
} from "lucide-react";

interface CvResultsProps {
  cvUploadId: string;
}

interface AnalysisResult {
  id: string;
  analysisType: string;
  resultData: string;
  createdAt: string;
}

interface CvUpload {
  id: string;
  filename: string;
  originalText: string;
  jobDescription?: string;
  uploadedAt: string;
}

export default function CvResults({ cvUploadId }: CvResultsProps) {
  // Fetch CV upload details
  const { data: cvUpload } = useQuery<CvUpload>({
    queryKey: [`/api/cv-uploads/${cvUploadId}`],
  });

  // Fetch analysis results
  const { data: analysisResults = [], isLoading } = useQuery<AnalysisResult[]>({
    queryKey: [`/api/analysis-results/${cvUploadId}`],
  });

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'optimize_cv':
        return <Sparkles className="w-5 h-5 text-primary-500" />;
      case 'ats_optimization_check':
        return <Search className="w-5 h-5 text-blue-500" />;
      case 'grammar_check':
        return <FileText className="w-5 h-5 text-green-500" />;
      case 'recruiter_feedback':
        return <User className="w-5 h-5 text-orange-500" />;
      case 'cover_letter':
        return <FileText className="w-5 h-5 text-purple-500" />;
      case 'interview_questions':
        return <User className="w-5 h-5 text-teal-500" />;
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getAnalysisTitle = (type: string) => {
    switch (type) {
      case 'optimize_cv':
        return 'CV Optimization';
      case 'ats_optimization_check':
        return 'ATS Compatibility Check';
      case 'grammar_check':
        return 'Grammar & Style Review';
      case 'recruiter_feedback':
        return 'Recruiter Feedback';
      case 'cover_letter':
        return 'Cover Letter';
      case 'interview_questions':
        return 'Interview Questions';
      default:
        return 'Analysis Result';
    }
  };

  const isPremiumFeature = (type: string) => {
    return ['recruiter_feedback', 'cover_letter', 'interview_questions'].includes(type);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  if (analysisResults.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analysis Results Yet</h3>
          <p className="text-muted-foreground">
            Run some analysis on your CV to see results here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* CV Info Header */}
      {cvUpload && (
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <CardTitle className="text-xl">{cvUpload.filename}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Uploaded {new Date(cvUpload.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" data-testid="button-preview-cv">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" data-testid="button-download-cv">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          {cvUpload.jobDescription && (
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Target Job Description:</h4>
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="line-clamp-3">{cvUpload.jobDescription}</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Analysis Results */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analysis Results</h2>
          <Badge variant="secondary">
            {analysisResults.length} {analysisResults.length === 1 ? 'Result' : 'Results'}
          </Badge>
        </div>

        {analysisResults
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((result) => (
            <Card key={result.id} className="glass" data-testid={`result-${result.analysisType}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getAnalysisIcon(result.analysisType)}
                    <div>
                      <CardTitle className="text-lg">
                        {getAnalysisTitle(result.analysisType)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Generated {new Date(result.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isPremiumFeature(result.analysisType) && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                    <Button variant="outline" size="sm" data-testid={`button-copy-${result.analysisType}`}>
                      Copy Result
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <ScrollArea className="max-h-96 w-full">
                  <div className="space-y-4">
                    {result.analysisType === 'cover_letter' ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary-500">
                          <h4 className="font-semibold text-sm mb-2 text-primary-500">
                            Generated Cover Letter:
                          </h4>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                              {result.resultData}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ) : result.analysisType === 'interview_questions' ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-teal-500">
                          <h4 className="font-semibold text-sm mb-2 text-teal-500">
                            Potential Interview Questions:
                          </h4>
                          <div className="space-y-2">
                            {result.resultData.split('\n').filter(line => line.trim()).map((question, index) => (
                              <div key={index} className="flex items-start space-x-2">
                                <span className="text-teal-500 font-medium">{index + 1}.</span>
                                <span className="text-sm">{question}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : result.analysisType === 'ats_optimization_check' ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-blue-500">
                          <h4 className="font-semibold text-sm mb-2 text-blue-500">
                            ATS Compatibility Analysis:
                          </h4>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                              {result.resultData}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ) : result.analysisType === 'recruiter_feedback' ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-orange-500">
                          <h4 className="font-semibold text-sm mb-2 text-orange-500">
                            Professional Recruiter Feedback:
                          </h4>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                              {result.resultData}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                            {result.resultData}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
