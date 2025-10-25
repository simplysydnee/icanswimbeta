import { useState } from "react";
import { Upload, Video, X, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface UploadedVideo {
  id: string;
  name: string;
  date: string;
  url: string;
  thumbnail?: string;
}

export const VideoUpload = () => {
  const [videos, setVideos] = useState<UploadedVideo[]>([
    {
      id: "1",
      name: "First Float Attempt - Jan 15",
      date: "2024-01-15",
      url: "#",
      thumbnail: "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=400"
    },
    {
      id: "2", 
      name: "Bubble Blowing Progress - Jan 20",
      date: "2024-01-20",
      url: "#",
      thumbnail: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400"
    }
  ]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a video file",
          variant: "destructive"
        });
        return;
      }

      // Create a preview URL
      const url = URL.createObjectURL(file);
      const newVideo: UploadedVideo = {
        id: Date.now().toString(),
        name: file.name,
        date: new Date().toISOString().split('T')[0],
        url: url,
      };

      setVideos([...videos, newVideo]);
      toast({
        title: "Video uploaded!",
        description: `${file.name} has been added to progress videos`,
      });
    }
  };

  const removeVideo = (id: string) => {
    setVideos(videos.filter(v => v.id !== id));
    toast({
      title: "Video removed",
      description: "Video has been deleted from progress tracker",
    });
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <Label 
              htmlFor="video-upload" 
              className="cursor-pointer text-center"
            >
              <span className="text-lg font-semibold text-primary hover:text-primary/80 transition-colors">
                Click to upload progress video
              </span>
              <p className="text-sm text-muted-foreground mt-2">
                MP4, MOV, AVI up to 100MB
              </p>
            </Label>
            <Input
              id="video-upload"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </CardContent>
      </Card>

      {/* Video Gallery */}
      {videos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Progress Videos ({videos.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <Card key={video.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="relative aspect-video bg-muted">
                  {video.thumbnail ? (
                    <img 
                      src={video.thumbnail} 
                      alt={video.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeVideo(video.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="pt-4">
                  <p className="font-medium text-sm truncate">{video.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Uploaded: {new Date(video.date).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
