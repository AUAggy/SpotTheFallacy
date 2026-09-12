import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { useProgress } from "@/hooks/useProgress";
import { enhancedFallacies, enhancedQuestions } from "@/data/enhancedData";
import { 
  Download, 
  Upload, 
  Trash2, 
  ArrowLeft,
  Copy,
  Check
} from "lucide-react";

interface SettingsPanelProps {
  onBack: () => void;
}

export function SettingsPanel({ onBack }: SettingsPanelProps) {
  const { progress, exportProgress, importProgress, resetProgress } = useProgress();
  const [exportData, setExportData] = useState("");
  const [importData, setImportData] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    const data = exportProgress();
    setExportData(data);
    setShowExport(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exportData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Progress data copied to clipboard",
    });
  };

  const handleImport = () => {
    const success = importProgress(importData);
    if (success) {
      toast({
        title: "Imported!",
        description: "Your progress has been restored",
      });
      setShowImport(false);
      setImportData("");
    } else {
      toast({
        title: "Error",
        description: "Invalid data format. Please check your backup file.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    resetProgress();
    toast({
      title: "Reset Complete",
      description: "All progress has been cleared",
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Menu
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Manage your preferences and data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statistics Summary */}
          <div className="space-y-2">
            <h3 className="font-medium">Your Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-muted-foreground">Questions Answered</span>
                <span className="font-medium">{progress.totalQuestionsAnswered}</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-muted-foreground">Sessions Completed</span>
                <span className="font-medium">{progress.sessionsCompleted}</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-muted-foreground">Current Streak</span>
                <span className="font-medium">{progress.streak.current} {progress.streak.current === 1 ? "day" : "days"}</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span className="text-muted-foreground">Longest Streak</span>
                <span className="font-medium">{progress.streak.longest} {progress.streak.longest === 1 ? "day" : "days"}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Data Management */}
          <div className="space-y-4">
            <h3 className="font-medium">Data Management</h3>
            
            {/* Export */}
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Progress
              </Button>
              
              {showExport && (
                <div className="space-y-2">
                  <Textarea 
                    value={exportData} 
                    readOnly 
                    className="font-mono text-xs h-32"
                  />
                  <Button variant="secondary" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {copied ? "Copied!" : "Copy to Clipboard"}
                  </Button>
                </div>
              )}
            </div>

            {/* Import */}
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowImport(!showImport)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Progress
              </Button>
              
              {showImport && (
                <div className="space-y-2">
                  <Textarea 
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder="Paste your backup data here..."
                    className="font-mono text-xs h-32"
                  />
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleImport}
                    disabled={!importData}
                  >
                    Import Data
                  </Button>
                </div>
              )}
            </div>

            {/* Reset */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset All Progress
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your progress, including:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>{progress.totalQuestionsAnswered} questions answered</li>
                      <li>{progress.sessionsCompleted} sessions completed</li>
                      <li>Your best streak of {progress.streak.longest} {progress.streak.longest === 1 ? "day" : "days"}</li>
                      <li>All fallacy mastery data</li>
                    </ul>
                    <p className="mt-2 font-medium">This cannot be undone!</p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleReset}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Reset Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Separator />

          {/* About */}
          <div className="space-y-2">
            <h3 className="font-medium">About</h3>
            <p className="text-sm text-muted-foreground">
              The trainer brings back the fallacies you miss, right away and
              in later sessions, until you stop missing them. When you keep
              getting one right, it asks you to explain why it is wrong.
              That last part is the Feynman technique.
            </p>
            <p className="text-sm text-muted-foreground">
              Contains {enhancedFallacies.length} fallacies and {enhancedQuestions.length} practice scenarios.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
