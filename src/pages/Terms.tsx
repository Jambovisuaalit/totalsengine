import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/methodology" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Methodology
            </Link>
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Blog
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-4xl py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-12">Last updated: January 2025</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          
          {/* Important Notice */}
          <section className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-destructive mt-0 mb-3">Important Notice</h2>
            <p className="text-sm text-destructive/90 mb-0">
              Doctore AI is an <strong>informational analytics platform</strong>. We do not provide betting advice, 
              financial advice, or recommendations to place wagers. All data presented is for educational and 
              analytical purposes only. You are solely responsible for any decisions you make.
            </p>
          </section>

          {/* 1. Acceptance */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using Doctore AI ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, do not use the Service. We reserve the right to modify these 
              terms at any time, and your continued use constitutes acceptance of any changes.
            </p>
          </section>

          {/* 2. Nature of Service */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Nature of the Service</h2>
            <p className="text-muted-foreground mb-4">
              Doctore AI is a data analytics platform that identifies statistical discrepancies ("edges") between 
              market odds and calculated fair value probabilities. The Service provides:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Statistical analysis and probability calculations</li>
              <li>Historical performance data and metrics</li>
              <li>Educational content about sports analytics methodologies</li>
              <li>Informational summaries delivered via email</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              The Service does <strong>not</strong> provide betting tips, picks, predictions, or recommendations 
              to place any wager.
            </p>
          </section>

          {/* 3. Not Financial Advice */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Not Financial or Betting Advice</h2>
            <p className="text-muted-foreground mb-4">
              <strong>The information provided by Doctore AI does not constitute financial advice, investment advice, 
              betting advice, or any other form of professional advice.</strong>
            </p>
            <p className="text-muted-foreground mb-4">
              All content, data, analysis, and calculations are provided for informational and educational purposes 
              only. Nothing on this platform should be interpreted as a recommendation to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Place any bet or wager</li>
              <li>Open or maintain any betting account</li>
              <li>Stake any particular amount on any outcome</li>
              <li>Follow any betting strategy or system</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              You should consult with qualified professionals before making any financial decisions. Past statistical 
              performance does not guarantee future results.
            </p>
          </section>

          {/* 4. User Responsibilities */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
            <p className="text-muted-foreground mb-4">By using the Service, you acknowledge and agree that:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>
                <strong>You are solely responsible</strong> for any decisions you make based on information 
                from the Service
              </li>
              <li>
                You will verify the <strong>legality of sports betting</strong> in your jurisdiction before 
                engaging in any betting activity
              </li>
              <li>
                You are of <strong>legal gambling age</strong> in your jurisdiction (typically 18 or 21 years old)
              </li>
              <li>
                You will <strong>gamble responsibly</strong> and within your means, and seek help if you 
                develop gambling-related problems
              </li>
              <li>
                You understand that <strong>all betting involves risk</strong> and you may lose money
              </li>
              <li>
                You will not use the Service to violate any laws or regulations in your jurisdiction
              </li>
              <li>
                You acknowledge that odds, lines, and market conditions can change rapidly, and displayed 
                information may not reflect current market state
              </li>
            </ul>
          </section>

          {/* 5. No Guarantees */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. No Guarantees or Warranties</h2>
            <p className="text-muted-foreground mb-4">
              The Service is provided "as is" and "as available" without any warranties of any kind, either 
              express or implied.
            </p>
            <p className="text-muted-foreground mb-4">We make no representations or warranties regarding:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>The accuracy, completeness, or reliability of any data or analysis</li>
              <li>The likelihood of any particular outcome occurring</li>
              <li>Future performance based on historical data</li>
              <li>The availability or timeliness of the Service</li>
              <li>The suitability of the information for any particular purpose</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Statistical edges identified by our system represent mathematical discrepancies, not predictions 
              or guarantees of profitability. Markets are inherently uncertain and past performance is not 
              indicative of future results.
            </p>
          </section>

          {/* 6. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
            <p className="text-muted-foreground mb-4">
              To the fullest extent permitted by applicable law, Doctore AI and its operators, affiliates, 
              officers, directors, employees, and agents shall not be liable for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Any direct, indirect, incidental, special, consequential, or punitive damages</li>
              <li>Any loss of profits, revenue, data, or financial losses</li>
              <li>Any losses arising from betting or gambling activities</li>
              <li>Any decisions made based on information provided by the Service</li>
              <li>Any errors, inaccuracies, or omissions in the data or analysis</li>
              <li>Any interruption or cessation of the Service</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              This limitation of liability applies regardless of the theory of liability (contract, tort, 
              strict liability, or otherwise) and even if we have been advised of the possibility of such damages.
            </p>
          </section>

          {/* 7. Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Indemnification</h2>
            <p className="text-muted-foreground">
              You agree to indemnify, defend, and hold harmless Doctore AI and its operators from any claims, 
              damages, losses, liabilities, costs, and expenses (including reasonable attorney fees) arising 
              from your use of the Service, your violation of these Terms, or your violation of any rights of 
              a third party.
            </p>
          </section>

          {/* 8. Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All content, methodologies, algorithms, data compilations, and materials on the Service are the 
              property of Doctore AI or its licensors and are protected by intellectual property laws. You may 
              not reproduce, distribute, modify, or create derivative works without our express written permission.
            </p>
          </section>

          {/* 9. Termination */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to suspend or terminate your access to the Service at any time, for any 
              reason, without notice. Upon termination, your right to use the Service ceases immediately. 
              Provisions that by their nature should survive termination shall survive.
            </p>
          </section>

          {/* 10. Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with applicable laws, without regard 
              to conflict of law principles. Any disputes arising from these Terms or your use of the Service 
              shall be resolved through binding arbitration.
            </p>
          </section>

          {/* 11. Responsible Gambling */}
          <section className="bg-muted/50 border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 mt-0">11. Responsible Gambling Resources</h2>
            <p className="text-muted-foreground mb-4">
              If you or someone you know has a gambling problem, please seek help:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>National Council on Problem Gambling:</strong> 1-800-522-4700</li>
              <li><strong>Gamblers Anonymous:</strong> www.gamblersanonymous.org</li>
              <li><strong>BeGambleAware:</strong> www.begambleaware.org</li>
            </ul>
            <p className="text-muted-foreground mt-4 mb-0">
              Gambling should be entertainment, not a way to make money. Never bet more than you can afford to lose.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms of Service, please contact us through the information provided 
              on our website.
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-16">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 Doctore AI. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link to="/methodology" className="hover:text-foreground transition-colors">Methodology</Link>
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Terms;