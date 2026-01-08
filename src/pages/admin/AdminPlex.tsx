import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Server, Film, Tv, RefreshCw, Download, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PlexLibrary {
  key: string;
  title: string;
  type: string;
  count: number;
}

interface PlexItem {
  ratingKey: string;
  title: string;
  type: string;
  year?: number;
  thumb?: string;
  summary?: string;
}

const AdminPlex = () => {
  const [serverUrl, setServerUrl] = useState("");
  const [plexToken, setPlexToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [libraries, setLibraries] = useState<PlexLibrary[]>([]);
  const [selectedLibraries, setSelectedLibraries] = useState<string[]>([]);
  const [previewItems, setPreviewItems] = useState<PlexItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const connectToPlex = async () => {
    if (!serverUrl || !plexToken) {
      toast.error("Please enter both server URL and Plex token");
      return;
    }

    setIsConnecting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("plex-import", {
        body: {
          action: "list-libraries",
          serverUrl: serverUrl.replace(/\/$/, ""),
          plexToken,
        },
      });

      if (error) throw error;

      if (data.libraries) {
        setLibraries(data.libraries);
        setIsConnected(true);
        toast.success("Connected to Plex server");
      } else {
        throw new Error("No libraries found");
      }
    } catch (error: any) {
      console.error("Plex connection error:", error);
      toast.error(error.message || "Failed to connect to Plex server");
      setIsConnected(false);
    }

    setIsConnecting(false);
  };

  const handleLibraryToggle = async (libraryKey: string) => {
    const newSelection = selectedLibraries.includes(libraryKey)
      ? selectedLibraries.filter((k) => k !== libraryKey)
      : [...selectedLibraries, libraryKey];
    
    setSelectedLibraries(newSelection);

    // Preview items from selected libraries
    if (newSelection.length > 0) {
      try {
        const { data, error } = await supabase.functions.invoke("plex-import", {
          body: {
            action: "preview",
            serverUrl: serverUrl.replace(/\/$/, ""),
            plexToken,
            libraryKeys: newSelection,
          },
        });

        if (!error && data.items) {
          setPreviewItems(data.items);
        }
      } catch (error) {
        console.error("Preview error:", error);
      }
    } else {
      setPreviewItems([]);
    }
  };

  const importContent = async () => {
    if (selectedLibraries.length === 0) {
      toast.error("Please select at least one library");
      return;
    }

    setIsImporting(true);

    try {
      const { data, error } = await supabase.functions.invoke("plex-import", {
        body: {
          action: "import",
          serverUrl: serverUrl.replace(/\/$/, ""),
          plexToken,
          libraryKeys: selectedLibraries,
        },
      });

      if (error) throw error;

      toast.success(`Successfully imported ${data.imported} items`);
      setSelectedLibraries([]);
      setPreviewItems([]);
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Failed to import content");
    }

    setIsImporting(false);
  };

  const getLibraryIcon = (type: string) => {
    switch (type) {
      case "movie":
        return <Film className="w-4 h-4" />;
      case "show":
        return <Tv className="w-4 h-4" />;
      default:
        return <Film className="w-4 h-4" />;
    }
  };

  return (
    <AdminLayout title="Plex Integration">
      <div className="space-y-6">
        {/* Connection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Connect to Plex Server
            </CardTitle>
            <CardDescription>
              Import content from your Plex Media Server library
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-secondary/50 border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">How to get your Plex Token:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Sign in to Plex Web App</li>
                    <li>Play any media, then click the "..." button</li>
                    <li>Select "Get Info" → "View XML"</li>
                    <li>Look for "X-Plex-Token" in the URL</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="serverUrl">Plex Server URL</Label>
                <Input
                  id="serverUrl"
                  placeholder="http://192.168.1.100:32400"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plexToken">Plex Token</Label>
                <Input
                  id="plexToken"
                  type="password"
                  placeholder="Your Plex token"
                  value={plexToken}
                  onChange={(e) => setPlexToken(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={connectToPlex} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Connect to Plex
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Libraries */}
        {isConnected && libraries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Libraries to Import</CardTitle>
              <CardDescription>
                Choose which Plex libraries to import content from
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {libraries.map((library) => (
                  <div
                    key={library.key}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedLibraries.includes(library.key)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-secondary/50"
                    }`}
                    onClick={() => handleLibraryToggle(library.key)}
                  >
                    <Checkbox
                      checked={selectedLibraries.includes(library.key)}
                      onCheckedChange={() => handleLibraryToggle(library.key)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getLibraryIcon(library.type)}
                        <span className="font-medium truncate">{library.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {library.count} items • {library.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedLibraries.length > 0 && (
                <Button onClick={importContent} disabled={isImporting} className="w-full">
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Import {previewItems.length} Items
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Preview */}
        {previewItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Preview ({previewItems.length} items)</CardTitle>
              <CardDescription>
                These items will be imported as draft content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-h-96 overflow-y-auto">
                {previewItems.slice(0, 20).map((item) => (
                  <div
                    key={item.ratingKey}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    {item.thumb ? (
                      <img
                        src={`${serverUrl}/photo/:/transcode?width=80&height=120&url=${encodeURIComponent(item.thumb)}&X-Plex-Token=${plexToken}`}
                        alt={item.title}
                        className="w-10 h-14 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                        {getLibraryIcon(item.type)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {item.type}
                        </Badge>
                        {item.year && <span>{item.year}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {previewItems.length > 20 && (
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  And {previewItems.length - 20} more items...
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPlex;
