import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navigation from "@/components/layout/navigation";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Crown, Clock, TrendingUp, FileText, Users, BarChart3, ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface UsageStats {
  optimizedCvs: number;
  atsChecks: number;
  coverLetters: number;
  recruiterFeedback: number;
}

interface CvUpload {
  id: string;
  filename: string;
  uploadedAt: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if user has premium access
  const hasPremiumAccess = user?.premiumUntil && new Date() < new Date(user.premiumUntil);

  useEffect(() => {
    if (!hasPremiumAccess) {
      toast({
        title: "Premium Required",
        description: "This dashboard is only available for Premium users.",
        variant: "destructive",
      });
      setLocation("/subscribe");
    }
  }, [hasPremiumAccess, setLocation, toast]);

  // Fetch usage stats
  const { data: usageStats } = useQuery<UsageStats>({
    queryKey: ['/api/usage-stats'],
    enabled: hasPremiumAccess,
  });

  // Fetch recent CV uploads
  const { data: cvUploads = [] } = useQuery<CvUpload[]>({
    queryKey: ['/api/cv-uploads'],
    enabled: hasPremiumAccess,
  });

  if (!hasPremiumAccess) {
    return null; // Will redirect via useEffect
  }

  const stats = [
    {
      label: "Optimized CVs",
      value: usageStats?.optimizedCvs || 0,
      color: "text-primary-500",
      icon: FileText,
      description: "Total CV optimizations"
    },
    {
      label: "ATS Score",
      value: "87%",
      color: "text-green-500", 
      icon: BarChart3,
      description: "Average ATS compatibility"
    },
    {
      label: "Cover Letters",
      value: usageStats?.coverLetters || 0,
      color: "text-blue-500",
      icon: FileText,
      description: "AI-generated letters"
    },
    {
      label: "Recruiter Feedback",
      value: usageStats?.recruiterFeedback || 0,
      color: "text-purple-500",
      icon: Users,
      description: "Professional reviews"
    }
  ];

  const recentActivity = [
    {
      icon: "fas fa-magic",
      text: "CV optimized for \"Senior Developer\"",
      time: "2 hours ago",
      color: "primary-500"
    },
    {
      icon: "fas fa-file-alt", 
      text: "Cover letter generated",
      time: "1 day ago",
      color: "green-500"
    },
    {
      icon: "fas fa-search",
      text: "ATS analysis completed",
      time: "3 days ago", 
      color: "blue-500"
    },
    {
      icon: "fas fa-user-tie",
      text: "Recruiter feedback received",
      time: "5 days ago",
      color: "purple-500"
    }
  ];

  const trends = [
    { label: "ATS Score", value: 87, color: "green-500" },
    { label: "Content Quality", value: 92, color: "blue-500" },
    { label: "Keywords", value: 78, color: "purple-500" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        showUser={true}
        user={user}
        onLogout={() => window.location.href = '/api/logout'}
      />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-back-home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                <Crown className="w-4 h-4 mr-2" />
                Premium Active
              </Badge>
            </div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.firstName || 'User'}!
            </h1>
            <p className="text-muted-foreground">
              Here's your CV optimization analytics overview
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="glass">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-3">
                    <IconComponent className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className={`text-3xl font-bold ${stat.color} mb-2`}>
                    {stat.value}
                  </div>
                  <div className="font-medium text-sm mb-1">
                    {stat.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.description}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Dashboard Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-primary-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full bg-${activity.color}/20 flex items-center justify-center`}>
                      <i className={`${activity.icon} text-${activity.color} text-sm`}></i>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{activity.text}</div>
                      <div className="text-xs text-muted-foreground">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Trends */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-secondary-500" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {trends.map((trend, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{trend.label}</span>
                      <span className="font-semibold">{trend.value}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`bg-gradient-to-r from-${trend.color} to-${trend.color}/80 h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${trend.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-primary-500/10 rounded-lg border border-primary-500/20">
                <div className="flex items-center mb-2">
                  <TrendingUp className="w-4 h-4 text-primary-500 mr-2" />
                  <span className="font-semibold text-sm">Improvement Tip</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your keyword optimization is at 78%. Consider adding more industry-specific terms to improve ATS compatibility.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent CVs */}
        <Card className="glass mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-500" />
              Recent CV Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cvUploads.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cvUploads.slice(0, 6).map((upload) => (
                  <div 
                    key={upload.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    data-testid={`dashboard-cv-${upload.id}`}
                  >
                    <div className="flex items-center mb-2">
                      <FileText className="w-4 h-4 text-muted-foreground mr-2" />
                      <span className="font-medium text-sm truncate">
                        {upload.filename}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Uploaded {new Date(upload.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No CVs uploaded yet</p>
                <Link href="/">
                  <Button className="mt-4" data-testid="button-upload-first-cv">
                    Upload Your First CV
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
