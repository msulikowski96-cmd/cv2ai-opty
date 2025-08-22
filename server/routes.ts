import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import multer from "multer";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { optimizeCv, generateRecruiterFeedback, generateCoverLetter, atsOptimizationCheck, generateInterviewQuestions, generateNewCv } from "./services/openrouter";
import { extractTextFromPdf } from "./services/pdf-processor";
import { rateLimiter } from "./middleware/rate-limiter";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  },
});

// Developer authentication middleware
function isDeveloper(req: any, res: any, next: any) {
  if (req.session.isDeveloper) {
    req.user = { 
      claims: { 
        sub: 'dev-account',
        email: 'developer@cvoptimizer.local',
        first_name: 'Developer',
        last_name: 'Account'
      }
    };
    return next();
  }
  return res.status(401).json({ message: 'Developer access required' });
}

// Combined authentication middleware
function isAuthenticatedOrDeveloper(req: any, res: any, next: any) {
  if (req.session.isDeveloper) {
    req.user = { 
      claims: { 
        sub: 'dev-account',
        email: 'developer@cvoptimizer.local',
        first_name: 'Developer',
        last_name: 'Account'
      }
    };
    return next();
  }
  return isAuthenticated(req, res, next);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Developer login route
  app.post('/api/dev-login', async (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'developer' && password === 'NewDev2024!') {
      req.session.isDeveloper = true;
      res.json({ 
        message: 'Developer logged in successfully',
        user: {
          id: 'dev-account',
          email: 'developer@cvoptimizer.local',
          firstName: 'Developer',
          lastName: 'Account',
          premiumUntil: '2030-12-31T23:59:59.000Z',
          basicPurchased: true
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid developer credentials' });
    }
  });

  // Developer logout route
  app.post('/api/dev-logout', (req, res) => {
    req.session.isDeveloper = false;
    res.json({ message: 'Developer logged out successfully' });
  });

  // Email/Password registration route
  app.post('/api/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email i hasło są wymagane' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Hasło musi mieć co najmniej 6 znaków' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Użytkownik z tym emailem już istnieje' });
      }

      // Create user
      const user = await storage.createUserWithPassword(email, password, firstName, lastName);
      
      // Create usage stats for new user
      await storage.getOrCreateUsageStats(user.id);

      res.json({ 
        success: true, 
        message: 'Konto zostało utworzone pomyślnie',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Błąd podczas tworzenia konta' });
    }
  });

  // Email/Password login route
  app.post('/api/email-login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: 'Błąd serwera' });
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Nieprawidłowe dane logowania' });
      }

      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Błąd logowania' });
        }
        
        res.json({ 
          success: true, 
          message: 'Zalogowano pomyślnie',
          user: {
            id: user.claims.sub,
            email: user.claims.email,
            firstName: user.claims.first_name,
            lastName: user.claims.last_name
          }
        });
      });
    })(req, res, next);
  });

  // Universal logout route
  app.post('/api/logout', (req, res) => {
    req.logout(() => {
      req.session.isDeveloper = false;
      res.json({ message: 'Wylogowano pomyślnie' });
    });
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticatedOrDeveloper, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // CV Upload route
  app.post('/api/upload-cv', isAuthenticatedOrDeveloper, upload.single('cvFile'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      const jobDescription = req.body.jobDescription || '';

      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      let extractedText: string;
      
      if (file.mimetype === 'application/pdf') {
        extractedText = await extractTextFromPdf(file.buffer);
      } else {
        // For DOC/DOCX files, we'd need additional processing
        extractedText = file.buffer.toString('utf-8');
      }

      const cvUpload = await storage.createCvUpload({
        userId,
        filename: file.originalname,
        originalText: extractedText,
        jobDescription,
      });

      res.json({ 
        success: true, 
        cvUploadId: cvUpload.id,
        extractedText: extractedText.substring(0, 500) + '...' // Preview
      });
    } catch (error) {
      console.error('CV upload error:', error);
      res.status(500).json({ message: 'Failed to upload CV' });
    }
  });

  // CV Analysis routes
  app.post('/api/analyze-cv', isAuthenticatedOrDeveloper, rateLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { cvUploadId, analysisType, jobDescription } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check user permissions
      const hasBasic = user.basicPurchased;
      const hasPremium = user.premiumUntil && new Date() < user.premiumUntil;
      
      const basicFeatures = ['optimize_cv', 'ats_optimization_check', 'grammar_check'];
      const premiumFeatures = ['recruiter_feedback', 'cover_letter', 'interview_questions'];
      
      if (!hasBasic && !hasPremium && basicFeatures.includes(analysisType)) {
        return res.status(403).json({ message: 'Basic plan required for this feature' });
      }
      
      if (!hasPremium && premiumFeatures.includes(analysisType)) {
        return res.status(403).json({ message: 'Premium plan required for this feature' });
      }

      const cvUpload = await storage.getCvUpload(cvUploadId);
      if (!cvUpload || cvUpload.userId !== userId) {
        return res.status(404).json({ message: 'CV not found' });
      }

      let result: string;
      
      switch (analysisType) {
        case 'optimize_cv':
          result = await optimizeCv(cvUpload.originalText, jobDescription);
          await storage.incrementUsageStat(userId, 'optimizedCvs');
          break;
        case 'ats_optimization_check':
          result = await atsOptimizationCheck(cvUpload.originalText, jobDescription);
          await storage.incrementUsageStat(userId, 'atsChecks');
          break;
        case 'recruiter_feedback':
          result = await generateRecruiterFeedback(cvUpload.originalText, jobDescription);
          await storage.incrementUsageStat(userId, 'recruiterFeedback');
          break;
        case 'cover_letter':
          result = await generateCoverLetter(cvUpload.originalText, jobDescription);
          await storage.incrementUsageStat(userId, 'coverLetters');
          break;
        case 'interview_questions':
          result = await generateInterviewQuestions(cvUpload.originalText, jobDescription);
          break;
        default:
          return res.status(400).json({ message: 'Invalid analysis type' });
      }

      const analysisResult = await storage.createAnalysisResult({
        cvUploadId,
        analysisType,
        resultData: result,
      });

      res.json({ success: true, result, analysisId: analysisResult.id });
    } catch (error) {
      console.error('CV analysis error:', error);
      res.status(500).json({ message: 'Failed to analyze CV' });
    }
  });

  // Get user's CV uploads
  app.get('/api/cv-uploads', isAuthenticatedOrDeveloper, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const uploads = await storage.getCvUploadsByUser(userId);
      res.json(uploads);
    } catch (error) {
      console.error('Error fetching CV uploads:', error);
      res.status(500).json({ message: 'Failed to fetch CV uploads' });
    }
  });

  // Get analysis results for a CV
  app.get('/api/analysis-results/:cvUploadId', isAuthenticatedOrDeveloper, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { cvUploadId } = req.params;
      
      const cvUpload = await storage.getCvUpload(cvUploadId);
      if (!cvUpload || cvUpload.userId !== userId) {
        return res.status(404).json({ message: 'CV not found' });
      }
      
      const results = await storage.getAnalysisResultsByCv(cvUploadId);
      res.json(results);
    } catch (error) {
      console.error('Error fetching analysis results:', error);
      res.status(500).json({ message: 'Failed to fetch analysis results' });
    }
  });

  // Get user usage stats
  app.get('/api/usage-stats', isAuthenticatedOrDeveloper, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getOrCreateUsageStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      res.status(500).json({ message: 'Failed to fetch usage stats' });
    }
  });

  // Generate new CV using Qwen 72B
  app.post('/api/generate-new-cv', isAuthenticatedOrDeveloper, rateLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { personalInfo, experience, education, skills, jobDescription } = req.body;

      if (!personalInfo?.name) {
        return res.status(400).json({ message: 'Imię i nazwisko są wymagane' });
      }

      const result = await generateNewCv(
        personalInfo,
        experience,
        education,
        skills,
        jobDescription
      );

      // Save generated CV as a new upload
      const cvUpload = await storage.createCvUpload({
        userId,
        filename: `Wygenerowane_CV_${personalInfo.name?.replace(/\s+/g, '_')}_${Date.now()}.txt`,
        originalText: result,
        jobDescription: jobDescription || '',
      });

      await storage.incrementUsageStat(userId, 'optimizedCvs');

      res.json({ 
        success: true, 
        result, 
        cvUploadId: cvUpload.id,
        message: 'Nowe CV zostało wygenerowane pomyślnie!'
      });
    } catch (error) {
      console.error('CV generation error:', error);
      res.status(500).json({ message: 'Błąd podczas generowania CV' });
    }
  });

  // Stripe payment route for one-time payments (Basic plan)
  app.post("/api/create-payment-intent", isAuthenticatedOrDeveloper, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const amount = 999; // 9.99 PLN in grosze

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "pln",
        metadata: {
          userId,
          planType: 'basic'
        }
      });

      // Create payment record
      await storage.createPayment({
        userId,
        stripePaymentId: paymentIntent.id,
        amount: "9.99",
        planType: 'basic',
        status: 'pending'
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Payment intent error:', error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Stripe subscription route for Premium plan
  app.post('/api/create-subscription', isAuthenticatedOrDeveloper, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        const invoice = subscription.latest_invoice as Stripe.Invoice;
        return res.json({
          subscriptionId: subscription.id,
          clientSecret: invoice?.payment_intent ? (invoice.payment_intent as Stripe.PaymentIntent).client_secret : null,
        });
      }
      
      if (!user.email) {
        return res.status(400).json({ message: 'No user email on file' });
      }

      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'CV Optimizer User',
        });
        customerId = customer.id;
        await storage.updateUserStripeInfo(userId, customerId);
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price_data: {
            currency: 'pln',
            product: {
              name: 'CV Optimizer Premium'
            },
            unit_amount: 2999, // 29.99 PLN
            recurring: {
              interval: 'month'
            }
          }
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(userId, customerId, subscription.id);

      // Create payment record
      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntentId = invoice?.payment_intent ? (invoice.payment_intent as Stripe.PaymentIntent).id : '';
      
      await storage.createPayment({
        userId,
        stripePaymentId: paymentIntentId,
        amount: "29.99",
        planType: 'premium',
        status: 'pending'
      });
  
      const clientSecret = invoice?.payment_intent ? (invoice.payment_intent as Stripe.PaymentIntent).client_secret : null;
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: clientSecret,
      });
    } catch (error: any) {
      console.error('Subscription error:', error);
      return res.status(400).json({ error: { message: error.message } });
    }
  });

  // Stripe webhook for payment confirmations
  app.post('/api/stripe-webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata.userId;
        const planType = paymentIntent.metadata.planType;
        
        if (planType === 'basic') {
          await storage.updateUserBasic(userId);
        }
        break;
        
      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        // Update premium until date (1 month from now)
        const premiumUntil = new Date();
        premiumUntil.setMonth(premiumUntil.getMonth() + 1);
        
        // Find user by subscription ID and update premium status
        // You'd need to add a method to find user by subscription ID
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
