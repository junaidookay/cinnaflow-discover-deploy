import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Loader2, CheckCircle } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import FileUploadField from './FileUploadField';

type PlatformType = Database['public']['Enums']['platform_type'];

const schema = z.object({
  creatorName: z.string().min(1, 'Creator name is required').max(100),
  platform: z.enum(['twitch', 'youtube', 'kick']),
  channelUrl: z.string().url('Must be a valid URL'),
  thumbnailUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

interface SubmitChannelFormProps {
  onSuccess?: () => void;
}

const SubmitChannelForm = ({ onSuccess }: SubmitChannelFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    creatorName: '',
    platform: 'twitch' as PlatformType,
    channelUrl: '',
    thumbnailUrl: '',
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

    const { error } = await supabase.from('creator_promotions').insert({
      creator_name: formData.creatorName,
      platform: formData.platform,
      channel_url: formData.channelUrl,
      thumbnail_url: formData.thumbnailUrl || null,
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
        <p className="text-muted-foreground mb-4">We'll review your channel and get back to you soon.</p>
        <Button onClick={() => setSubmitted(false)} variant="outline">
          Submit Another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="creatorName">Creator Name *</Label>
        <Input
          id="creatorName"
          value={formData.creatorName}
          onChange={(e) => setFormData({ ...formData, creatorName: e.target.value })}
          placeholder="Your channel or creator name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="platform">Platform *</Label>
        <Select
          value={formData.platform}
          onValueChange={(value: PlatformType) => setFormData({ ...formData, platform: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="twitch">Twitch</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="kick">Kick</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="channelUrl">Channel URL *</Label>
        <Input
          id="channelUrl"
          type="url"
          value={formData.channelUrl}
          onChange={(e) => setFormData({ ...formData, channelUrl: e.target.value })}
          placeholder="https://twitch.tv/your-channel"
          required
        />
      </div>

      {/* Thumbnail Upload */}
      <FileUploadField
        label="Channel Thumbnail / Banner"
        accept="image/*,.jpg,.jpeg,.png,.webp"
        fileType="image"
        value={formData.thumbnailUrl}
        onChange={(url) => setFormData({ ...formData, thumbnailUrl: url })}
        userId={user?.id || ''}
        placeholder="https://example.com/thumbnail.jpg"
      />

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Video className="w-4 h-4 mr-2" />
            Submit for Review
          </>
        )}
      </Button>
    </form>
  );
};

export default SubmitChannelForm;