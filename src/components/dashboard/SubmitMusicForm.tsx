import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Music, Loader2, CheckCircle } from 'lucide-react';
import FileUploadField from './FileUploadField';

const schema = z.object({
  artistName: z.string().min(1, 'Artist name is required').max(100),
  videoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  thumbnailUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  musicFileUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  youtube: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  spotify: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  instagram: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

interface SubmitMusicFormProps {
  onSuccess?: () => void;
}

const SubmitMusicForm = ({ onSuccess }: SubmitMusicFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    artistName: '',
    videoUrl: '',
    thumbnailUrl: '',
    musicFileUrl: '',
    youtube: '',
    spotify: '',
    instagram: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = schema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    if (!user?.email) {
      toast.error('You must be logged in to submit');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from('artist_promotions').insert({
      artist_name: formData.artistName,
      video_embed_url: formData.videoUrl || null,
      thumbnail_url: formData.thumbnailUrl || null,
      music_file_url: formData.musicFileUrl || null,
      external_links: {
        youtube: formData.youtube || null,
        spotify: formData.spotify || null,
        instagram: formData.instagram || null,
      },
      submitter_email: user.email,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error('Failed to submit. Please try again.');
    } else {
      setSubmitted(true);
      toast.success('Submission received! We will review it shortly.');
      onSuccess?.();
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Submission Received!</h3>
        <p className="text-muted-foreground mb-4">We'll review your music and get back to you soon.</p>
        <Button onClick={() => setSubmitted(false)} variant="outline">
          Submit Another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="artistName">Artist Name *</Label>
        <Input
          id="artistName"
          value={formData.artistName}
          onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
          placeholder="Your artist or band name"
          required
        />
      </div>

      {/* Music File Upload */}
      <FileUploadField
        label="Music File"
        accept="audio/*,.mp3,.wav,.flac,.aac,.ogg"
        fileType="audio"
        value={formData.musicFileUrl}
        onChange={(url) => setFormData({ ...formData, musicFileUrl: url })}
        userId={user?.id || ''}
        placeholder="https://soundcloud.com/... or direct audio URL"
      />

      {/* Thumbnail Upload */}
      <FileUploadField
        label="Thumbnail / Cover Art"
        accept="image/*,.jpg,.jpeg,.png,.webp"
        fileType="image"
        value={formData.thumbnailUrl}
        onChange={(url) => setFormData({ ...formData, thumbnailUrl: url })}
        userId={user?.id || ''}
        placeholder="https://example.com/cover.jpg"
      />

      <div className="space-y-2">
        <Label htmlFor="videoUrl">Music Video Embed URL</Label>
        <Input
          id="videoUrl"
          type="url"
          value={formData.videoUrl}
          onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
          placeholder="https://youtube.com/embed/..."
        />
        <p className="text-xs text-muted-foreground">
          YouTube, Vimeo, or other embeddable video URL
        </p>
      </div>

      <div className="border-t border-border pt-6">
        <Label className="text-sm font-medium mb-3 block">Social Links</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="youtube" className="text-xs text-muted-foreground">YouTube</Label>
            <Input
              id="youtube"
              type="url"
              value={formData.youtube}
              onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
              placeholder="YouTube link"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="spotify" className="text-xs text-muted-foreground">Spotify</Label>
            <Input
              id="spotify"
              type="url"
              value={formData.spotify}
              onChange={(e) => setFormData({ ...formData, spotify: e.target.value })}
              placeholder="Spotify link"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram" className="text-xs text-muted-foreground">Instagram</Label>
            <Input
              id="instagram"
              type="url"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              placeholder="Instagram link"
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Music className="w-4 h-4 mr-2" />
            Submit for Review
          </>
        )}
      </Button>
    </form>
  );
};

export default SubmitMusicForm;