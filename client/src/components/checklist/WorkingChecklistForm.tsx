import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Send, Camera, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { checklistData } from './checklistData';
import { useToast } from '@/hooks/use-toast';

interface ChecklistResponse {
  [key: string]: any;
}

interface WorkingChecklistFormProps {
  templateId: string;
}

export default function WorkingChecklistForm({ templateId: propTemplateId }: WorkingChecklistFormProps) {
  const { templateId: paramTemplateId } = useParams<{ templateId: string }>();
  const templateId = propTemplateId || paramTemplateId;
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [responses, setResponses] = useState<ChecklistResponse>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Get the checklist template
  const template = templateId ? checklistData[templateId] : null;
  
  if (!template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-slate-500">
          <CardContent className="p-6">
            <p className="text-white">Checklist not found.</p>
            <Button onClick={() => navigate('/checklists')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Checklists
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInputChange = (itemId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const calculateCompletion = () => {
    let total = 0;
    let completed = 0;
    
    template.sections.forEach((section: any) => {
      section.items.forEach((item: any) => {
        total++;
        if (item.required && responses[item.id] && responses[item.id].toString().trim()) {
          completed++;
        } else if (!item.required) {
          // Non-required items count as completed if they exist or if we skip them
          completed++;
        }
      });
    });
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Here you would normally save to your backend
      console.log('Submitting checklist:', { templateId, responses });
      
      toast({
        title: "Success!",
        description: "Checklist submitted successfully",
      });
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate('/checklists');
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit checklist",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (item: any) => {
    // If the item has options but no inputType, treat as select
    if (item.options && item.options.length > 0 && (!item.inputType || item.inputType === 'select')) {
      return (
        <Select value={responses[item.id] || ''} onValueChange={(value) => handleInputChange(item.id, value)}>
          <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {item.options.map((option: string, index: number) => (
              <SelectItem key={index} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Handle other input types
    const commonProps = {
      value: responses[item.id] || '',
      onChange: (e: any) => handleInputChange(item.id, e.target.value),
      className: "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
    };

    switch (item.inputType) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            placeholder={item.placeholder}
            rows={4}
          />
        );
      
      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            placeholder={item.placeholder}
          />
        );
      
      case 'email':
        return (
          <Input
            {...commonProps}
            type="email"
            placeholder={item.placeholder}
          />
        );
      
      case 'tel':
        return (
          <Input
            {...commonProps}
            type="tel"
            placeholder={item.placeholder}
          />
        );
      
      case 'date':
        return (
          <Input
            {...commonProps}
            type="date"
          />
        );
      
      default:
        return (
          <Textarea
            {...commonProps}
            placeholder={item.placeholder || "Describe in detail..."}
            rows={3}
          />
        );
    }
  };

  const completion = calculateCompletion();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={() => navigate('/checklists')}
              variant="ghost"
              className="text-slate-300 hover:text-white hover:bg-slate-800/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Checklists
            </Button>
            
            <div className="flex items-center space-x-4">
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                {completion}% Complete
              </Badge>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || completion < 80}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 mr-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Submit Checklist
              </Button>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">{template.title}</h1>
            <p className="text-slate-300 max-w-2xl mx-auto">{template.description}</p>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          className="mb-8"
        >
          <div className="bg-slate-800/50 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-blue-500 to-green-500"
            />
          </div>
        </motion.div>

        {/* Form Sections */}
        <div className="space-y-8">
          {template.sections.map((section: any, sectionIndex: number) => (
            <motion.div
              key={sectionIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
            >
              <Card className="bg-slate-200 dark:bg-slate-800/50 border-slate-400 dark:border-slate-600 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-slate-800 dark:text-white flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                      <span className="text-blue-300 font-medium">{sectionIndex + 1}</span>
                    </div>
                    {section.title}
                  </CardTitle>
                  {section.description && (
                    <CardDescription className="text-slate-600 dark:text-slate-300">
                      {section.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {section.items.map((item: any, itemIndex: number) => (
                    <div key={item.id} className="space-y-2">
                      <label className="flex items-center text-slate-700 dark:text-slate-200 font-medium">
                        {item.question}
                        {item.required && (
                          <span className="text-red-400 ml-1">*</span>
                        )}
                        {item.critical && (
                          <AlertTriangle className="w-4 h-4 text-orange-400 ml-2" />
                        )}
                      </label>
                      
                      {renderField(item)}
                      
                      {/* Additional features */}
                      <div className="flex items-center space-x-4">
                        {item.images && (
                          <Button variant="outline" size="sm" className="text-slate-600 dark:text-slate-300">
                            <Camera className="w-3 h-3 mr-1" />
                            Add Photo
                          </Button>
                        )}
                        {item.files && (
                          <Button variant="outline" size="sm" className="text-slate-600 dark:text-slate-300">
                            <FileText className="w-3 h-3 mr-1" />
                            Attach File
                          </Button>
                        )}
                      </div>

                      {item.complianceStandard && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Compliance: {item.complianceStandard}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="space-y-4">
            <p className="text-slate-400">
              Please complete all required fields ({completion}% complete)
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/checklists')}
                className="text-slate-300 border-slate-600 hover:bg-slate-800/50"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || completion < 80}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 mr-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {completion >= 80 ? 'Submit Checklist' : `${completion}% Complete`}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}