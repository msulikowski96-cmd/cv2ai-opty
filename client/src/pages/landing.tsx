import { useState } from "react";
import { Link } from "wouter";
import Navigation from "@/components/layout/navigation";
import Footer from "@/components/layout/footer";
import AuthModal from "@/components/modals/auth-modal";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Upload, Play, Check, Crown, Timer } from "lucide-react";

export default function Landing() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const features = [
    {
      icon: "fas fa-search",
      title: "Analiza ATS",
      description: "Sprawdź kompatybilność swojego CV z systemami ATS używanymi przez rekruterów.",
      plan: "basic",
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-400"
    },
    {
      icon: "fas fa-magic",
      title: "Optymalizacja AI",
      description: "Automatyczna optymalizacja treści CV pod konkretne stanowiska pracy.",
      plan: "basic",
      gradient: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-400"
    },
    {
      icon: "fas fa-spell-check",
      title: "Korekta językowa",
      description: "Zaawansowana korekta gramatyki i stylu pisania w języku polskim.",
      plan: "basic",
      gradient: "from-green-500/20 to-emerald-500/20",
      iconColor: "text-green-400"
    },
    {
      icon: "fas fa-user-tie",
      title: "Opinia rekrutera",
      description: "Otrzymaj szczegółową opinię na temat swojego CV z perspektywy rekrutera.",
      plan: "premium",
      gradient: "from-orange-500/20 to-red-500/20",
      iconColor: "text-orange-400"
    },
    {
      icon: "fas fa-file-alt",
      title: "List motywacyjny AI",
      description: "Generuj spersonalizowane listy motywacyjne dopasowane do ofert pracy.",
      plan: "premium",
      gradient: "from-indigo-500/20 to-purple-500/20",
      iconColor: "text-indigo-400"
    },
    {
      icon: "fas fa-chart-line",
      title: "Analytics Dashboard",
      description: "Śledzenie statystyk optymalizacji i analiza skuteczności CV.",
      plan: "premium",
      gradient: "from-teal-500/20 to-blue-500/20",
      iconColor: "text-teal-400"
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "0 zł",
      period: "Zawsze darmowy",
      features: [
        { text: "Podgląd z watermarkiem", included: true },
        { text: "Pobieranie plików", included: false },
        { text: "Funkcje AI", included: false }
      ],
      buttonText: "Aktualny plan",
      buttonVariant: "outline" as const,
      popular: false
    },
    {
      name: "Basic",
      price: "9,99 zł",
      period: "Jednorazowa płatność",
      features: [
        { text: "Optymalizacja CV", included: true },
        { text: "Sprawdzenie ATS", included: true },
        { text: "Korekta gramatyki", included: true },
        { text: "Pobieranie bez watermarku", included: true }
      ],
      buttonText: "Wybierz Basic",
      buttonVariant: "default" as const,
      popular: true
    },
    {
      name: "Premium",
      price: "29,99 zł",
      period: "Na miesiąc",
      features: [
        { text: "Wszystko z Basic", included: true },
        { text: "Opinia rekrutera", included: true },
        { text: "List motywacyjny AI", included: true },
        { text: "Analytics Dashboard", included: true },
        { text: "Generator CV AI", included: true }
      ],
      buttonText: "Wybierz Premium",
      buttonVariant: "premium" as const,
      popular: false,
      premium: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation onAuthClick={() => setIsAuthModalOpen(true)} />
      
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-secondary-500/10 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_70%)]"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="animate-float">
            <Badge variant="secondary" className="mb-8 bg-primary-500/20 text-primary-400 border-primary-500/30">
              <Sparkles className="w-4 h-4 mr-2" />
              Powered by Advanced AI
            </Badge>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              Optymalizuj swoje CV
            </span>
            <br />
            <span className="text-foreground">z mocą sztucznej inteligencji</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Przekształć swoje CV w narzędzie, które przyciągnie uwagę rekruterów. 
            Nasza zaawansowana AI analizuje, optymalizuje i dostosowuje Twoje CV do wymagań nowoczesnego rynku pracy.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:shadow-lg hover:scale-105 transition-all duration-300"
              onClick={() => setIsAuthModalOpen(true)}
              data-testid="button-upload-cv-free"
            >
              <Upload className="w-5 h-5 mr-2" />
              Przesyłaj CV teraz - GRATIS
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="glass border-muted-foreground/30 hover:bg-muted/20"
              data-testid="button-demo"
            >
              <Play className="w-5 h-5 mr-2" />
              Zobacz demo
            </Button>
          </div>
          
          {/* CV Upload Zone */}
          <div className="max-w-2xl mx-auto">
            <FileUpload 
              onFileSelect={(file) => {
                console.log('File selected:', file.name);
                setIsAuthModalOpen(true);
              }}
              data-testid="cv-upload-zone"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Zaawansowane funkcje AI
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Wykorzystaj moc sztucznej inteligencji do stworzenia CV, które wyróżni Cię na rynku pracy
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="glass hover-lift relative overflow-hidden" data-testid={`feature-card-${index}`}>
                {feature.plan === 'premium' && (
                  <Badge className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                    PREMIUM
                  </Badge>
                )}
                <CardContent className="p-8">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}>
                    <i className={`${feature.icon} text-2xl ${feature.iconColor}`}></i>
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    {feature.plan === 'premium' ? (
                      <>
                        <Crown className="w-4 h-4 text-yellow-400 mr-2" />
                        <span>Tylko w planie Premium</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-green-400 mr-2" />
                        <span>Dostępne w planie Basic</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Wybierz swój plan
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Rozpocznij za darmo, wybierz plan dostosowany do Twoich potrzeb
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`glass hover-lift relative overflow-hidden ${
                  plan.popular ? 'border-primary-500/50' : ''
                } ${plan.premium ? 'premium-glow' : ''}`}
                data-testid={`pricing-card-${plan.name.toLowerCase()}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary-500/20 text-primary-400 border-primary-500/30">
                    Najpopularniejszy
                  </Badge>
                )}
                {plan.premium && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-400/20 to-transparent"></div>
                )}
                
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="text-4xl font-bold mb-2">{plan.price}</div>
                    <p className="text-muted-foreground">{plan.period}</p>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-400 mr-3" />
                        ) : (
                          <Timer className="w-5 h-5 text-red-400 mr-3" />
                        )}
                        <span className={feature.included ? '' : 'text-muted-foreground'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${
                      plan.buttonVariant === 'premium' 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-lg hover:scale-105' 
                        : plan.buttonVariant === 'default'
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 hover:shadow-lg hover:scale-105'
                        : ''
                    }`}
                    variant={plan.buttonVariant === 'premium' || plan.buttonVariant === 'default' ? 'default' : 'outline'}
                    onClick={() => {
                      if (plan.buttonText.includes('Wybierz')) {
                        setIsAuthModalOpen(true);
                      }
                    }}
                    data-testid={`button-select-${plan.name.toLowerCase()}`}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Dashboard Preview */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Premium Dashboard
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Śledź swoje postępy i analizuj skuteczność CV z zaawansowanymi narzędziami analitycznymi
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <Card className="glass overflow-hidden" data-testid="dashboard-preview">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Witaj, Jan Kowalski!</h3>
                    <p className="text-muted-foreground">Oto podsumowanie Twojej aktywności</p>
                  </div>
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white mt-4 md:mt-0">
                    <Crown className="w-4 h-4 mr-2" />
                    Premium Active
                  </Badge>
                </div>
                
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                  {[
                    { label: "Zoptymalizowane CV", value: "12", color: "text-primary-500" },
                    { label: "Średni wynik ATS", value: "87%", color: "text-green-500" },
                    { label: "Listy motywacyjne", value: "8", color: "text-blue-500" },
                    { label: "Opinie rekruterów", value: "15", color: "text-purple-500" }
                  ].map((stat, index) => (
                    <Card key={index} className="glass-light dark:glass">
                      <CardContent className="p-6 text-center">
                        <div className={`text-3xl font-bold ${stat.color} mb-2`}>
                          {stat.value}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {stat.label}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="glass-light dark:glass">
                    <CardContent className="p-6">
                      <h4 className="text-lg font-semibold mb-4 flex items-center">
                        <i className="fas fa-clock text-primary-500 mr-2"></i>
                        Ostatnia aktywność
                      </h4>
                      <div className="space-y-4">
                        {[
                          { icon: "fas fa-magic", text: "CV zoptymalizowane pod \"Senior Developer\"", time: "2 godziny temu", color: "primary" },
                          { icon: "fas fa-file-alt", text: "List motywacyjny wygenerowany", time: "1 dzień temu", color: "green" },
                          { icon: "fas fa-search", text: "Analiza ATS przeprowadzona", time: "3 dni temu", color: "blue" }
                        ].map((activity, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                            <div className={`w-8 h-8 rounded-full bg-${activity.color}-500/20 flex items-center justify-center`}>
                              <i className={`${activity.icon} text-${activity.color}-500 text-sm`}></i>
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
                  
                  <Card className="glass-light dark:glass">
                    <CardContent className="p-6">
                      <h4 className="text-lg font-semibold mb-4 flex items-center">
                        <i className="fas fa-chart-line text-secondary-500 mr-2"></i>
                        Trendy skuteczności
                      </h4>
                      <div className="space-y-4">
                        {[
                          { label: "Wynik ATS", value: 87, color: "green" },
                          { label: "Jakość treści", value: 92, color: "blue" },
                          { label: "Słowa kluczowe", value: 78, color: "purple" }
                        ].map((trend, index) => (
                          <div key={index}>
                            <div className="flex justify-between text-sm mb-2">
                              <span>{trend.label}</span>
                              <span className="font-semibold">{trend.value}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className={`bg-gradient-to-r from-${trend.color}-500 to-${trend.color}-600 h-2 rounded-full transition-all duration-300`}
                                style={{ width: `${trend.value}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
