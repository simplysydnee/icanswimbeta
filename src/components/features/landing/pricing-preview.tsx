import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star } from 'lucide-react';
import Link from 'next/link';

const pricingTiers = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started and small projects',
    features: [
      'Up to 1,000 users',
      'Basic analytics',
      'Community support',
      'Core API access',
      'Standard templates',
    ],
    limitations: [
      'Limited API calls',
      'Basic support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: 29,
    description: 'Best for growing businesses and teams',
    features: [
      'Up to 10,000 users',
      'Advanced analytics',
      'Priority support',
      'Full API access',
      'Premium templates',
      'Custom branding',
      'Team collaboration',
      'Advanced security',
    ],
    limitations: [],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: null,
    description: 'Custom solutions for large organizations',
    features: [
      'Unlimited users',
      'Custom analytics',
      'Dedicated support',
      'White-label solution',
      'Custom integrations',
      'SSO & SAML',
      'Custom SLA',
      'Advanced compliance',
    ],
    limitations: [],
    cta: 'Contact Sales',
    popular: false,
  },
];

export function PricingPreview() {
  return (
    <section id="pricing" className="py-20 sm:py-32 bg-muted/30">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Simple, Transparent{' '}
            <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your needs. All plans include our core features with 14-day free trial.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingTiers.map((tier) => (
            <Card key={tier.name} className={`relative ${tier.popular ? 'border-primary shadow-glow scale-105' : ''}`}>
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    <Star className="h-3 w-3 fill-current" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <div className="mt-4">
                  {tier.price === null ? (
                    <div className="text-3xl font-bold">Custom</div>
                  ) : (
                    <div className="text-4xl font-bold">
                      ${tier.price}
                      <span className="text-lg font-normal text-muted-foreground">/month</span>
                    </div>
                  )}
                </div>
                <CardDescription className="mt-2">
                  {tier.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Button 
                  className={`w-full mb-6 ${tier.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                  variant={tier.popular ? 'default' : 'outline'}
                  asChild
                >
                  <Link href={tier.name === 'Enterprise' ? '/contact' : '/auth/signup'}>
                    {tier.cta}
                  </Link>
                </Button>

                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-4 w-4 text-primary mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {tier.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-start text-muted-foreground">
                      <Check className="h-4 w-4 text-muted-foreground mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-sm">{limitation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ section */}
        <div className="mt-20 text-center">
          <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            <div>
              <h4 className="font-medium mb-2">Can I change plans anytime?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">What payment methods do you accept?</h4>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards, PayPal, and bank transfers for enterprise plans.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Is there a free trial?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, all paid plans come with a 14-day free trial. No credit card required.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Do you offer refunds?</h4>
              <p className="text-sm text-muted-foreground">
                We offer a 30-day money-back guarantee on all paid plans, no questions asked.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}