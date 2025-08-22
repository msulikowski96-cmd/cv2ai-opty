import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/layout/navigation";
import Footer from "@/components/layout/footer";
import FileUpload from "@/components/ui/file-upload";
import CvAnalyzer from "@/components/cv/cv-analyzer";
import CvResults from "@/components/cv/cv-results";
import CvGenerator from "@/components/cv/cv-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Upload, FileText, BarChart3, Crown, LogOut, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CvUpload {
  id: string;
  filename: string;
  originalText: string;
  jobDescription?: string;
  uploadedAt: string;
}

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");

  // Fetch user's CV uploads
  const { data: cvUploads = [], isLoading: uploadsLoading } = useQuery<CvUpload[]>({
    queryKey: ['/api/cv-uploads'],
  });

  // Fetch usage stats
  const { data: usageStats } = useQuery({
    queryKey: ['/api/usage-stats'],
  });

  // CV upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "CV uploaded successfully!",
        description: "Your CV has been processed and is ready for analysis.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cv-uploads'] });
      setSelectedCvId(data.cvUploadId);
      setAnalysisMode(true);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (file: File, jobDescription?: string) => {
    const formData = new FormData();
    formData.append('cvFile', file);
    if (jobDescription) {
      formData.append('jobDescription', jobDescription);
    }
    uploadMutation.mutate(formData);
  };

  const handleCvGenerated = (cvId: string, result: string) => {
    setSelectedCvId(cvId);
    setAnalysisMode(true);
    setActiveTab("upload"); // Switch to analysis tab after generation
  };

  const hasBasicAccess = user?.basicPurchased;
  const hasPremiumAccess = user?.premiumUntil && new Date() < new Date(user.premiumUntil);

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        showUser={true}
        user={user}
        onLogout={() => window.location.href = '/api/logout'}
      />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome back, {user?.firstName || 'User'}!
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Ready to optimize your CV with AI?
          </p>
          
          {/* Plan Status */}
          <div className="flex justify-center gap-4 mb-8">
            {hasPremiumAccess && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2">
                <Crown className="w-4 h-4 mr-2" />
                Premium Active
              </Badge>
            )}
            {hasBasicAccess && !hasPremiumAccess && (
              <Badge variant="secondary" className="px-4 py-2">
                Basic Plan Active
              </Badge>
            )}
            {!hasBasicAccess && !hasPremiumAccess && (
              <div className="flex gap-2">
                <Link href="/checkout">
                  <Badge variant="outline" className="px-4 py-2 cursor-pointer hover:bg-muted">
                    Upgrade to Basic (9.99 PLN)
                  </Badge>
                </Link>
                <Link href="/subscribe">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 cursor-pointer">
                    Get Premium (29.99 PLN/month)
                  </Badge>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Usage Statistics */}
        {usageStats && (hasBasicAccess || hasPremiumAccess) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary-500 mb-1">
                  {usageStats.optimizedCvs || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  CV Optimizations
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500 mb-1">
                  {usageStats.atsChecks || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  ATS Checks
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-500 mb-1">
                  {usageStats.coverLetters || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Cover Letters
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-500 mb-1">
                  {usageStats.recruiterFeedback || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Recruiter Feedback
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* CV Upload/Generate Section */}
          <div className="lg:col-span-2">
            {!analysisMode ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Przeanalizuj CV
                  </TabsTrigger>
                  <TabsTrigger value="generate" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Wygeneruj nowe CV
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload">
                  <Card className="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Upload className="w-5 h-5 mr-2" />
                        Prześlij CV do analizy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FileUpload
                        onFileSelect={handleFileUpload}
                        isLoading={uploadMutation.isPending}
                        showJobDescription={true}
                        data-testid="cv-upload-home"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="generate">
                  <CvGenerator onGenerated={handleCvGenerated} />
                </TabsContent>
              </Tabs>
            ) : selectedCvId ? (
              <CvAnalyzer 
                cvUploadId={selectedCvId}
                onBack={() => setAnalysisMode(false)}
                userPlan={hasPremiumAccess ? 'premium' : hasBasicAccess ? 'basic' : 'free'}
              />
            ) : null}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent CV Uploads */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Recent CVs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {uploadsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
                    ))}
                  </div>
                ) : cvUploads.length > 0 ? (
                  <div className="space-y-3">
                    {cvUploads.slice(0, 5).map((upload) => (
                      <div 
                        key={upload.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setSelectedCvId(upload.id);
                          setAnalysisMode(true);
                        }}
                        data-testid={`cv-item-${upload.id}`}
                      >
                        <div className="font-medium text-sm truncate">
                          {upload.filename}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(upload.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No CVs uploaded yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={!hasPremiumAccess}
                    data-testid="button-dashboard"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Premium Dashboard
                  </Button>
                </Link>
                <Link href="/checkout">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={hasBasicAccess}
                    data-testid="button-upgrade-basic"
                  >
                    Upgrade to Basic
                  </Button>
                </Link>
                <Link href="/subscribe">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={hasPremiumAccess}
                    data-testid="button-upgrade-premium"
                  >
                    Get Premium
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {selectedCvId && analysisMode && (
        <CvResults cvUploadId={selectedCvId} />
      )}

      <Footer />
    </div>
  );
}
