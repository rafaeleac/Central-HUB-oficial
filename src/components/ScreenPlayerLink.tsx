import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScreenPlayerLinkProps {
  screenCode: string;
  screenName: string;
}

const ScreenPlayerLink = ({ screenCode, screenName }: ScreenPlayerLinkProps) => {
  const { toast } = useToast();
  const playerUrl = `${window.location.origin}/player/${screenCode}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(playerUrl);
    toast({
      title: "URL copiada!",
      description: "A URL do player foi copiada para a área de transferência.",
    });
  };

  const openPlayer = () => {
    window.open(playerUrl, "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          URL do Player - {screenName}
        </CardTitle>
        <CardDescription>
          Use esta URL para abrir o player em qualquer dispositivo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <code className="flex-1 p-3 bg-muted rounded text-sm break-all">
            {playerUrl}
          </code>
          <Button size="icon" variant="outline" onClick={copyUrl}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={openPlayer} className="w-full">
          <ExternalLink className="mr-2 h-4 w-4" />
          Abrir Player em Nova Aba
        </Button>
      </CardContent>
    </Card>
  );
};

export default ScreenPlayerLink;
