import { Link } from "wouter";
import { Bot } from "lucide-react";

export default function Footer() {
  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "FAQ", href: "#faq" },
        { label: "Support", href: "#support" }
      ]
    },
    {
      title: "Company", 
      links: [
        { label: "About", href: "#about" },
        { label: "Blog", href: "#blog" },
        { label: "Careers", href: "#careers" },
        { label: "Contact", href: "#contact" }
      ]
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#docs" },
        { label: "API", href: "#api" },
        { label: "Status", href: "#status" },
        { label: "Privacy Policy", href: "#privacy" }
      ]
    }
  ];

  const socialLinks = [
    { icon: "fab fa-twitter", href: "#twitter", label: "Twitter" },
    { icon: "fab fa-linkedin", href: "#linkedin", label: "LinkedIn" },
    { icon: "fab fa-facebook", href: "#facebook", label: "Facebook" }
  ];

  return (
    <footer className="py-16 border-t border-border bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                CV Optimizer Pro
              </span>
            </div>
            <p className="text-muted-foreground mb-6">
              Optimize your CV with the power of artificial intelligence.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:bg-muted/20 transition-colors"
                  aria-label={social.label}
                  data-testid={`social-link-${social.label.toLowerCase()}`}
                >
                  <i className={social.icon}></i>
                </a>
              ))}
            </div>
          </div>
          
          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2 text-muted-foreground">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a 
                      href={link.href}
                      className="hover:text-foreground transition-colors"
                      data-testid={`footer-link-${link.label.toLowerCase().replace(' ', '-')}`}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Copyright */}
        <div className="border-t border-border pt-8 mt-8 text-center text-muted-foreground">
          <p>&copy; 2024 CV Optimizer Pro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
