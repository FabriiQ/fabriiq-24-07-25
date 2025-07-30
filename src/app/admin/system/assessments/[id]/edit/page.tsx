import { Metadata } from 'next';
import { AssessmentForm } from '~/components/assessment/assessment-form';
import { PageHeader } from '~/components/ui/layout/page-header';

export const metadata: Metadata = {
  title: 'Edit Assessment | System Admin',
  description: 'Edit an existing assessment',
};

interface EditAssessmentPageProps {
  params: Promise<{
    id: string;
  
  }>;
}

export default async function EditAssessmentPage({ params }: EditAssessmentPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Assessment"
        description="Modify an existing assessment"
      />
      <AssessmentForm assessmentId={id} />
    </div>
  );
}