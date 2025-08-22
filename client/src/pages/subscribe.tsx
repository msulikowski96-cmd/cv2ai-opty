import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Lock, Crown } from "lucide-react";
import Navigation from "@/components/layout/navigation";
import { useAuth } from "@/hooks/useAuth";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/?subscription=success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Subscription Successful",
        description: "Welcome to Premium! You now have access to all features.",
      });
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500"
        disabled={!stripe || isProcessing}
        data-testid="button-complete-subscription"
      >
        <Lock className="w-4 h-4 mr-2" />
        {isProcessing ? 'Processing...' : 'Subscribe for 29.99 PLN/month'}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("POST", "/api/create-subscription", {})
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation showUser={true} user={user} />
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation showUser={true} user={user} />
        <div className="container mx-auto px-4 pt-24">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <p className="text-destructive">Failed to initialize subscription. Please try again.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation showUser={true} user={user} />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white mb-4">
              <Crown className="w-4 h-4 mr-2" />
              Premium Plan
            </Badge>
            <h1 className="text-3xl font-bold mb-2">Upgrade to Premium</h1>
            <p className="text-muted-foreground">Unlock the full power of AI-driven CV optimization</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Plan Summary */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-400/20 to-transparent"></div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-yellow-500" />
                  Premium Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold">29.99 PLN</div>
                  <p className="text-muted-foreground">per month</p>
                  
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-semibold">Everything in Basic, plus:</h4>
                    <div className="space-y-2">
                      {[
                        "Recruiter feedback analysis",
                        "AI-generated cover letters", 
                        "Interview preparation questions",
                        "Advanced analytics dashboard",
                        "Priority customer support",
                        "Multiple CV templates"
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Elements 
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                    }
                  }}
                >
                  <SubscribeForm />
                </Elements>
                
                <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center">
                    <Lock className="w-4 h-4 inline mr-1" />
                    Secure payment powered by Stripe
                  </div>
                  <p className="text-center">
                    Cancel anytime. No hidden fees.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
