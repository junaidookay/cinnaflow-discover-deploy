import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const schema = z.object({
  artistName: z.string().min(1, 'Artist name is required').max(100),
  videoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  thumbnailUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  youtube: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  spotify: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  instagram: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  email: z.string().email('Must be a valid email'),
});

const SubmitArtist = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    artistName: '',
    videoUrl: '',
    thumbnailUrl: '',
    youtube: '',
    spotify: '',
    instagram: '',
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

    const { error } = await supabase.from('artist_promotions').insert({
      artist_name: formData.artistName,
      video_embed_url: formData.videoUrl || null,
      thumbnail_url: formData.thumbnailUrl || null,
      external_links: {
        youtube: formData.youtube || null,
        spotify: formData.spotify || null,
        instagram: formData.instagram || null,
      },
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
          <h1 className="text-3xl font-display text-foreground mb-2">Submit Your Music</h1>
          <p className="text-muted-foreground mb-8">Get featured in our Artists section</p>

          <form onSubmit={handleSubmit} className="space-y-4 bg-card border border-border rounded-xl p-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Artist Name *</label>
              <input type="text" value={formData.artistName} onChange={(e) => setFormData({ ...formData, artistName: e.target.value })} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Music Video Embed URL</label>
              <input type="url" value={formData.videoUrl} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="https://youtube.com/embed/..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Thumbnail URL</label>
              <input type="url" value={formData.thumbnailUrl} onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">YouTube Link</label>
              <input type="url" value={formData.youtube} onChange={(e) => setFormData({ ...formData, youtube: e.target.value })} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Spotify Link</label>
              <input type="url" value={formData.spotify} onChange={(e) => setFormData({ ...formData, spotify: e.target.value })} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Instagram Link</label>
              <input type="url" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
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

export default SubmitArtist;
