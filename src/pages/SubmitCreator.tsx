import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { Database } from '@/integrations/supabase/types';

type PlatformType = Database['public']['Enums']['platform_type'];

const schema = z.object({
  creatorName: z.string().min(1, 'Creator name is required').max(100),
  platform: z.enum(['twitch', 'youtube', 'kick']),
  channelUrl: z.string().url('Must be a valid URL'),
  thumbnailUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  email: z.string().email('Must be a valid email'),
});

const SubmitCreator = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    creatorName: '',
    platform: 'twitch' as PlatformType,
    channelUrl: '',
    thumbnailUrl: '',
    email: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = schema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from('creator_promotions').insert({
      creator_name: formData.creatorName,
      platform: formData.platform,
      channel_url: formData.channelUrl,
      thumbnail_url: formData.thumbnailUrl || null,
      submitter_email: formData.email,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error('Failed to submit. Please try again.');
    } else {
      toast.success('Submission received! We will review it shortly.');
      navigate('/promote');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-xl">
          <h1 className="text-3xl font-display text-foreground mb-2">Submit Your Channel</h1>
          <p className="text-muted-foreground mb-8">Get featured in our Creators section</p>

          <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border rounded-xl p-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Creator Name *</label>
              <input type="text" value={formData.creatorName} onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Platform *</label>
              <select value={formData.platform} onChange={(e) => setFormData({ ...formData, platform: e.target.value as PlatformType })} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="twitch">Twitch</option>
                <option value="youtube">YouTube</option>
                <option value="kick">Kick</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Channel URL *</label>
              <input type="url" value={formData.channelUrl} onChange={(e) => setFormData({ ...formData, channelUrl: e.target.value })} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Thumbnail URL</label>
              <input type="url" value={formData.thumbnailUrl} onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Your Email *</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubmitCreator;
