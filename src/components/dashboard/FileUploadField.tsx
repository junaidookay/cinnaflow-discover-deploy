import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Link, Loader2, Check, X, Music, Image } from 'lucide-react';

interface FileUploadFieldProps {
  label: string;
  accept: string;
  fileType: 'audio' | 'image';
  value: string;
  onChange: (url: string) => void;
  userId: string;
  placeholder?: string;
}

const FileUploadField = ({ 
  label, 
  accept, 
  fileType, 
  value, 
  onChange, 
  userId,
  placeholder = 'https://...'
}: FileUploadFieldProps) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 50MB for audio, 10MB for images)
    const maxSize = fileType === 'audio' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Max size: ${fileType === 'audio' ? '50MB' : '10MB'}`);
      return;
    }

    setIsUploading(true);
    setFileName(file.name);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${fileType}s/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success('File uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file');
      setFileName(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = () => {
    onChange('');
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const Icon = fileType === 'audio' ? Music : Image;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'link')}>
        <TabsList className="grid w-full grid-cols-2 mb-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="link" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            Link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-0">
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
            id={`file-${label.replace(/\s/g, '-')}`}
          />
          
          {value && activeTab === 'upload' ? (
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">
                  {fileName || 'Uploaded file'}
                </p>
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Uploaded successfully
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                className="shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full h-20 border-dashed"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload {fileType}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Max {fileType === 'audio' ? '50MB' : '10MB'}
                  </span>
                </div>
              )}
            </Button>
          )}
        </TabsContent>

        <TabsContent value="link" className="mt-0">
          <Input
            type="url"
            value={activeTab === 'link' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FileUploadField;