import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, FileText, Loader2 } from "lucide-react";

interface CvGeneratorProps {
  onGenerated?: (cvId: string, result: string) => void;
}

export default function CvGenerator({ onGenerated }: CvGeneratorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    profession: ''
  });
  
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [skills, setSkills] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/generate-new-cv', data);
    },
    onSuccess: (data) => {
      toast({
        title: "CV wygenerowane!",
        description: "Twoje nowe CV zostało utworzone za pomocą AI.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cv-uploads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/usage-stats'] });
      
      if (onGenerated) {
        onGenerated(data.cvUploadId, data.result);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Błąd generowania",
        description: error.message || "Nie udało się wygenerować CV",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!personalInfo.name.trim()) {
      toast({
        title: "Brak danych",
        description: "Imię i nazwisko są wymagane",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      personalInfo,
      experience,
      education,
      skills,
      jobDescription
    });
  };

  const resetForm = () => {
    setPersonalInfo({ name: '', email: '', phone: '', location: '', profession: '' });
    setExperience('');
    setEducation('');
    setSkills('');
    setJobDescription('');
  };

  return (
    <Card className="w-full max-w-4xl mx-auto backdrop-blur-md bg-white/10 dark:bg-black/10 border border-white/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Generator CV z AI</CardTitle>
            <p className="text-muted-foreground">
              Stwórz profesjonalne CV od podstaw używając modelu Qwen 72B
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Dane osobowe</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Imię i nazwisko *</Label>
              <Input
                id="name"
                value={personalInfo.name}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Jan Kowalski"
                data-testid="input-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder="jan.kowalski@email.com"
                data-testid="input-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+48 123 456 789"
                data-testid="input-phone"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Lokalizacja</Label>
              <Input
                id="location"
                value={personalInfo.location}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Warszawa, Polska"
                data-testid="input-location"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="profession">Zawód/Specjalizacja</Label>
              <Input
                id="profession"
                value={personalInfo.profession}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, profession: e.target.value }))}
                placeholder="np. Frontend Developer, Marketing Manager"
                data-testid="input-profession"
              />
            </div>
          </div>
        </div>

        {/* Experience */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Doświadczenie zawodowe</h3>
          <div className="space-y-2">
            <Label htmlFor="experience">Opisz swoje doświadczenie zawodowe</Label>
            <Textarea
              id="experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="np. 3 lata jako Frontend Developer w ABC Company, odpowiedzialny za tworzenie interfejsów użytkownika..."
              rows={4}
              data-testid="textarea-experience"
            />
          </div>
        </div>

        {/* Education */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Wykształcenie</h3>
          <div className="space-y-2">
            <Label htmlFor="education">Opisz swoje wykształcenie</Label>
            <Textarea
              id="education"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="np. Magister Informatyki, Politechnika Warszawska, 2020..."
              rows={3}
              data-testid="textarea-education"
            />
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Umiejętności</h3>
          <div className="space-y-2">
            <Label htmlFor="skills">Wymień swoje umiejętności</Label>
            <Textarea
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="np. React, JavaScript, TypeScript, CSS, HTML, Git, Agile..."
              rows={3}
              data-testid="textarea-skills"
            />
          </div>
        </div>

        {/* Target Job */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Docelowe stanowisko (opcjonalne)</h3>
          <div className="space-y-2">
            <Label htmlFor="jobDescription">Opis stanowiska, na które aplikujesz</Label>
            <Textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Wklej opis stanowiska lub wymagania pracodawcy, aby dostosować CV..."
              rows={4}
              data-testid="textarea-job-description"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !personalInfo.name.trim()}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            data-testid="button-generate-cv"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generowanie...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generuj CV z AI
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={resetForm}
            disabled={generateMutation.isPending}
            data-testid="button-reset-form"
          >
            Wyczyść formularz
          </Button>
        </div>

        <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
          <p className="font-medium mb-1">💡 Wskazówka:</p>
          <p>Im więcej szczegółów podasz, tym lepsze będzie wygenerowane CV. AI uzupełni brakujące informacje profesjonalnymi przykładami.</p>
        </div>
      </CardContent>
    </Card>
  );
}