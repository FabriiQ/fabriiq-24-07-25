'use client';

/**
 * Enhanced Quiz Creator Component
 * 
 * Main component for creating quiz assessments with enhanced features including
 * question bank integration, auto-selection, and real-time analytics.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Save, Eye, Settings, BookOpen, BarChart, Zap } from 'lucide-react';

import { QuizQuestionSelector } from './QuizQuestionSelector';
import { BloomsDistributionChart } from './BloomsDistributionChart';
import { AutoSelectionWizard } from './AutoSelectionWizard';
import { 
  EnhancedAssessmentInput, 
  QuestionSelectionMode, 
  AssessmentContent,
  AssessmentSettings 
} from '../../types/enhanced-assessment';
import { EnhancedQuestion, BloomsDistribution } from '../../types/quiz-question-filters';
import { AssessmentCategory, DifficultyLevel } from '@prisma/client';
import { api } from '@/utils/api';

export interface EnhancedQuizCreatorProps {
  initialData?: Partial<EnhancedAssessmentInput>;
  classId: string;
  subjectId: string;
  topicIds?: string[];
  onSave: (assessment: EnhancedAssessmentInput) => Promise<void>;
  onCancel: () => void;
  mode?: 'create' | 'edit';
}

export function EnhancedQuizCreator({
  initialData,
  classId,
  subjectId,
  topicIds = [],
  onSave,
  onCancel,
  mode = 'create',
}: EnhancedQuizCreatorProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<EnhancedQuestion[]>([]);
  const [showAutoWizard, setShowAutoWizard] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<EnhancedAssessmentInput>>({
    title: '',
    description: '',
    classId,
    subjectId,
    category: AssessmentCategory.QUIZ,
    maxScore: 100,
    passingScore: 60,
    weightage: 10,
    questionSelectionMode: QuestionSelectionMode.MANUAL,
    enhancedSettings: {
      timeLimit: 30,
      maxAttempts: 1,
      showFeedbackMode: 'after_submission',
      questionOrderRandomization: false,
      choiceOrderRandomization: false,
    },
    ...initialData,
  });

  // Get subject data
  const { data: subjectData } = api.subject.getById.useQuery({ id: subjectId });
  const { data: topicsData } = api.subjectTopic.getBySubject.useQuery({ subjectId });

  // Target Bloom's distribution (can be customized)
  const [targetBloomsDistribution, setTargetBloomsDistribution] = useState<BloomsDistribution>({
    REMEMBER: 20,
    UNDERSTAND: 25,
    APPLY: 25,
    ANALYZE: 20,
    EVALUATE: 7,
    CREATE: 3,
  });

  // Calculate current Bloom's distribution
  const currentBloomsDistribution = calculateBloomsDistribution(selectedQuestions);

  // Handle form field changes
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle settings changes
  const handleSettingsChange = (setting: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      enhancedSettings: {
        ...prev.enhancedSettings,
        [setting]: value,
      },
    }));
  };

  // Handle save
  const handleSave = async () => {
    try {
      setLoading(true);

      // Prepare assessment content
      const content: AssessmentContent = {
        assessmentType: 'QUIZ',
        description: formData.description,
        instructions: `Complete this quiz within ${formData.enhancedSettings?.timeLimit || 30} minutes.`,
        questions: selectedQuestions.map((q, index) => ({
          id: q.id,
          type: q.questionType,
          text: q.title,
          choices: (q.content as any)?.choices || [],
          correctAnswer: (q.content as any)?.correctAnswer,
          points: Math.round((formData.maxScore || 100) / selectedQuestions.length),
          bloomsLevel: q.bloomsLevel,
          questionBankRef: q.id,
          isFromQuestionBank: true,
          metadata: {
            difficulty: q.difficulty,
            estimatedTime: q.estimatedTime,
            tags: q.tags,
          },
          order: index + 1,
        })),
        settings: formData.enhancedSettings,
        metadata: {
          version: '1.0',
          qualityScore: calculateAverageQuality(selectedQuestions),
          estimatedCompletionTime: selectedQuestions.reduce((sum, q) => sum + (q.estimatedTime || 2), 0),
          bloomsAnalytics: {
            distribution: currentBloomsDistribution,
            balance: 0.8, // Mock balance score
            coverage: Object.keys(currentBloomsDistribution),
          },
        },
      };

      // Prepare final assessment data
      const assessmentData: EnhancedAssessmentInput = {
        ...formData,
        title: formData.title || 'Untitled Quiz',
        classId: formData.classId || classId,
        subjectId: formData.subjectId || subjectId,
        category: formData.category || 'QUIZ',
        content,
        questionBankRefs: selectedQuestions.map(q => q.id),
      };

      await onSave(assessmentData);
    } catch (error) {
      console.error('Error saving quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validation
  const isValid = formData.title && selectedQuestions.length > 0;

  return (
    <div className="enhanced-quiz-creator space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {mode === 'create' ? 'Create Quiz Assessment' : 'Edit Quiz Assessment'}
          </h2>
          <p className="text-muted-foreground">
            {subjectData?.name} • {selectedQuestions.length} questions selected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid || loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Quiz'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="questions" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Questions ({selectedQuestions.length})
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-6">
          <BasicInfoForm
            formData={formData}
            onFieldChange={handleFieldChange}
            subjectData={subjectData}
            topicsData={topicsData}
          />
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-6">
          {showAutoWizard ? (
            <AutoSelectionWizard
              subjectId={subjectId}
              topicIds={topicIds}
              onQuestionsSelected={(questions) => {
                setSelectedQuestions(questions);
                setShowAutoWizard(false);
                handleFieldChange('questionSelectionMode', QuestionSelectionMode.AUTO);
              }}
              onClose={() => setShowAutoWizard(false)}
              maxQuestions={20}
              initialTargetDistribution={targetBloomsDistribution}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Question Selection</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowAutoWizard(true)}
                  className="flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Auto-Select with AI
                </Button>
              </div>

              <QuizQuestionSelector
                selectedQuestions={selectedQuestions}
                onQuestionsChange={setSelectedQuestions}
                subjectId={subjectId}
                topicIds={topicIds}
                maxQuestions={20}
                targetBloomsDistribution={targetBloomsDistribution as Record<string, number>}
                mode={formData.questionSelectionMode || QuestionSelectionMode.MANUAL}
                onModeChange={(mode) => handleFieldChange('questionSelectionMode', mode)}
              />
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <QuizSettingsForm
            settings={formData.enhancedSettings || {}}
            onSettingsChange={handleSettingsChange}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <BloomsDistributionChart
            currentDistribution={currentBloomsDistribution}
            targetDistribution={targetBloomsDistribution}
            totalQuestions={selectedQuestions.length}
            maxQuestions={20}
            showTargetComparison={true}
            showRecommendations={true}
          />
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <QuizPreview
            formData={formData}
            questions={selectedQuestions}
            analytics={currentBloomsDistribution}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Basic Info Form Component
interface BasicInfoFormProps {
  formData: Partial<EnhancedAssessmentInput>;
  onFieldChange: (field: string, value: any) => void;
  subjectData?: any;
  topicsData?: any;
}

function BasicInfoForm({ formData, onFieldChange, subjectData, topicsData }: BasicInfoFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Quiz Title *</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => onFieldChange('title', e.target.value)}
              placeholder="Enter quiz title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => onFieldChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="QUIZ">Quiz</SelectItem>
                <SelectItem value="TEST">Test</SelectItem>
                <SelectItem value="EXAM">Exam</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => onFieldChange('description', e.target.value)}
            placeholder="Enter quiz description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxScore">Max Score</Label>
            <Input
              id="maxScore"
              type="number"
              value={formData.maxScore || 100}
              onChange={(e) => onFieldChange('maxScore', parseInt(e.target.value))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="passingScore">Passing Score</Label>
            <Input
              id="passingScore"
              type="number"
              value={formData.passingScore || 60}
              onChange={(e) => onFieldChange('passingScore', parseInt(e.target.value))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="weightage">Weightage (%)</Label>
            <Input
              id="weightage"
              type="number"
              value={formData.weightage || 10}
              onChange={(e) => onFieldChange('weightage', parseInt(e.target.value))}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quiz Settings Form Component
interface QuizSettingsFormProps {
  settings: Partial<AssessmentSettings>;
  onSettingsChange: (setting: string, value: any) => void;
}

function QuizSettingsForm({ settings, onSettingsChange }: QuizSettingsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timing & Attempts */}
        <div className="space-y-4">
          <h4 className="font-medium">Timing & Attempts</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
              <Input
                id="timeLimit"
                type="number"
                value={settings.timeLimit || 30}
                onChange={(e) => onSettingsChange('timeLimit', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAttempts">Max Attempts</Label>
              <Input
                id="maxAttempts"
                type="number"
                value={settings.maxAttempts || 1}
                onChange={(e) => onSettingsChange('maxAttempts', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Randomization */}
        <div className="space-y-4">
          <h4 className="font-medium">Randomization</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="questionOrder">Randomize Question Order</Label>
              <Switch
                id="questionOrder"
                checked={settings.questionOrderRandomization || false}
                onCheckedChange={(checked) => onSettingsChange('questionOrderRandomization', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="choiceOrder">Randomize Choice Order</Label>
              <Switch
                id="choiceOrder"
                checked={settings.choiceOrderRandomization || false}
                onCheckedChange={(checked) => onSettingsChange('choiceOrderRandomization', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Feedback */}
        <div className="space-y-4">
          <h4 className="font-medium">Feedback & Review</h4>
          <div className="space-y-2">
            <Label htmlFor="feedbackMode">Show Feedback</Label>
            <Select
              value={settings.showFeedbackMode || 'after_submission'}
              onValueChange={(value) => onSettingsChange('showFeedbackMode', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="after_submission">After Submission</SelectItem>
                <SelectItem value="after_due_date">After Due Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quiz Preview Component
interface QuizPreviewProps {
  formData: Partial<EnhancedAssessmentInput>;
  questions: EnhancedQuestion[];
  analytics: BloomsDistribution;
}

function QuizPreview({ formData, questions, analytics }: QuizPreviewProps) {
  const estimatedTime = questions.reduce((sum, q) => sum + (q.estimatedTime || 2), 0);
  const averageQuality = calculateAverageQuality(questions);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{formData.title || 'Untitled Quiz'}</CardTitle>
          <p className="text-muted-foreground">{formData.description}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{questions.length}</div>
              <div className="text-sm text-muted-foreground">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{estimatedTime}m</div>
              <div className="text-sm text-muted-foreground">Est. Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formData.maxScore}</div>
              <div className="text-sm text-muted-foreground">Max Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{averageQuality.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Avg Quality</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {questions.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No questions selected yet.</p>
            <p className="text-sm text-muted-foreground">Go to the Questions tab to add questions.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper Functions

function calculateBloomsDistribution(questions: EnhancedQuestion[]): BloomsDistribution {
  const total = questions.length;
  if (total === 0) return {};

  const distribution: BloomsDistribution = {};
  questions.forEach(q => {
    if (q.bloomsLevel) {
      distribution[q.bloomsLevel] = (distribution[q.bloomsLevel] || 0) + 1;
    }
  });

  // Convert to percentages
  Object.keys(distribution).forEach(level => {
    distribution[level as keyof BloomsDistribution] = 
      Math.round((distribution[level as keyof BloomsDistribution]! / total) * 100);
  });

  return distribution;
}

function calculateAverageQuality(questions: EnhancedQuestion[]): number {
  if (questions.length === 0) return 0;
  return questions.reduce((sum, q) => sum + (q.qualityScore || 3), 0) / questions.length;
}
