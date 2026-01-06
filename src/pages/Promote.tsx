import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Music, Video, Sparkles, ArrowRight, Check } from 'lucide-react';

const Promote = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm mb-4">
              <Sparkles className="w-4 h-4" />
              Grow Your Audience
            </span>
            <h1 className="text-4xl md:text-5xl font-display text-foreground mb-4">
              Promote on CinnaFlow
            </h1>
            <p className="text-lg text-muted-foreground">
              Get featured on our platform and reach thousands of viewers looking for fresh content
            </p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            {/* Artist Promotion */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
                <Music className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">For Artists</h2>
              <p className="text-muted-foreground mb-6">
                Promote your music videos and reach new fans through our Featured Artists section
              </p>
              <ul className="space-y-3 mb-8">
                {['Homepage Featured Placement', 'In-Feed Promotion', 'Sponsored Badge', 'External Links (YouTube, Spotify)'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/submit/artist"
                className="inline-flex items-center gap-2 w-full justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Submit Music
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Creator Promotion */}
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6">
                <Video className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">For Creators</h2>
              <p className="text-muted-foreground mb-6">
                Get featured in our Creators section and drive traffic to your channel
              </p>
              <ul className="space-y-3 mb-8">
                {['Featured Creator Placement', 'Live Now Discovery', 'Platform Badge (Twitch, YouTube, Kick)', 'Channel Promotion'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/submit/creator"
                className="inline-flex items-center gap-2 w-full justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Submit Channel
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div className="text-center bg-card border border-border rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-foreground mb-2">Need Custom Packages?</h3>
            <p className="text-muted-foreground mb-4">
              Contact us for enterprise promotions and custom placement options
            </p>
            <a href="mailto:promote@cinnaflow.com" className="text-primary hover:underline">
              promote@cinnaflow.com
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Promote;
