import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CloudUpload, FileText, X } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File, jobDescription?: string) => void;
  isLoading?: boolean;
  showJobDescription?: boolean;
  className?: string;
  'data-testid'?: string;
}

export default function FileUpload({ 
  onFileSelect, 
  isLoading = false, 
  showJobDescription = false,
  className = "",
  'data-testid': dataTestId
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const isValidFile = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid file type (PDF, DOC, DOCX)');
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('File size must be less than 10MB');
      return false;
    }
    
    return true;
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onFileSelect(selectedFile, showJobDescription ? jobDescription : undefined);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className={`space-y-6 ${className}`} data-testid={dataTestId}>
      {/* File Upload Area */}
      <Card 
        className={`glass transition-all duration-300 cursor-pointer border-2 border-dashed ${
          dragActive 
            ? 'border-primary-500 bg-primary-500/10' 
            : selectedFile 
              ? 'border-green-500 bg-green-500/10'
              : 'border-muted-foreground/30 hover:border-primary-500/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !selectedFile && document.getElementById('cv-file-input')?.click()}
      >
        <CardContent className="p-8">
          <div className="text-center">
            {selectedFile ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-500 mb-1">
                    File Selected
                  </h3>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  data-testid="button-clear-file"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary-500/20 flex items-center justify-center">
                  <CloudUpload className="w-8 h-8 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    Drag & drop your CV here
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    or click to select a file (PDF, DOC, DOCX)
                  </p>
                  <Button 
                    variant="outline" 
                    className="bg-primary-500/20 text-primary-400 border-primary-500/30 hover:bg-primary-500/30"
                    data-testid="button-select-file"
                  >
                    Select File
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <input
        id="cv-file-input"
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
        data-testid="input-file"
      />

      {/* Job Description (Optional) */}
      {showJobDescription && (
        <div className="space-y-2">
          <Label htmlFor="job-description" className="text-sm font-medium">
            Job Description (Optional)
          </Label>
          <Textarea
            id="job-description"
            placeholder="Paste the job description here to optimize your CV for this specific position..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={4}
            className="resize-none"
            data-testid="textarea-job-description"
          />
          <p className="text-xs text-muted-foreground">
            Adding a job description helps our AI tailor your CV optimization for better results.
          </p>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && (
        <Button 
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:shadow-lg"
          data-testid="button-upload-cv"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
              Processing...
            </>
          ) : (
            <>
              <CloudUpload className="w-4 h-4 mr-2" />
              Upload & Analyze CV
            </>
          )}
        </Button>
      )}
    </div>
  );
}
