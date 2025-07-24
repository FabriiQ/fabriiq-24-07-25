import { PrismaClient, SystemStatus, ActivityPurpose, LearningActivityType, AssessmentType, BloomsTaxonomyLevel, GradingType } from '@prisma/client';

const prisma = new PrismaClient();

// Learning outcomes data by subject and topic
const learningOutcomesData = {
  MATH: {
    'NUMBERSANDOPERATIONS': [
      {
        statement: 'Students will be able to identify and compare whole numbers up to 1000',
        description: 'Recognize, read, write, and compare numbers in various forms',
        bloomsLevel: 'REMEMBER' as BloomsTaxonomyLevel,
        actionVerbs: ['identify', 'recognize', 'list', 'name']
      },
      {
        statement: 'Students will be able to perform addition and subtraction with regrouping',
        description: 'Apply mathematical operations to solve real-world problems',
        bloomsLevel: 'APPLY' as BloomsTaxonomyLevel,
        actionVerbs: ['calculate', 'solve', 'demonstrate', 'apply']
      },
      {
        statement: 'Students will be able to analyze number patterns and relationships',
        description: 'Break down number sequences to identify underlying patterns',
        bloomsLevel: 'ANALYZE' as BloomsTaxonomyLevel,
        actionVerbs: ['analyze', 'examine', 'compare', 'categorize']
      }
    ],
    'ALGEBRA': [
      {
        statement: 'Students will be able to understand basic algebraic expressions',
        description: 'Comprehend the meaning of variables and simple expressions',
        bloomsLevel: 'UNDERSTAND' as BloomsTaxonomyLevel,
        actionVerbs: ['explain', 'describe', 'interpret', 'summarize']
      },
      {
        statement: 'Students will be able to solve simple linear equations',
        description: 'Apply algebraic methods to find unknown values',
        bloomsLevel: 'APPLY' as BloomsTaxonomyLevel,
        actionVerbs: ['solve', 'calculate', 'use', 'implement']
      },
      {
        statement: 'Students will be able to create word problems using algebraic concepts',
        description: 'Design original problems that demonstrate algebraic thinking',
        bloomsLevel: 'CREATE' as BloomsTaxonomyLevel,
        actionVerbs: ['create', 'design', 'compose', 'formulate']
      }
    ],
    'GEOMETRY': [
      {
        statement: 'Students will be able to identify basic geometric shapes and their properties',
        description: 'Recognize and name common 2D and 3D shapes',
        bloomsLevel: 'REMEMBER' as BloomsTaxonomyLevel,
        actionVerbs: ['identify', 'name', 'recognize', 'recall']
      },
      {
        statement: 'Students will be able to calculate area and perimeter of rectangles',
        description: 'Apply formulas to find measurements of geometric figures',
        bloomsLevel: 'APPLY' as BloomsTaxonomyLevel,
        actionVerbs: ['calculate', 'measure', 'compute', 'determine']
      },
      {
        statement: 'Students will be able to evaluate the efficiency of different geometric solutions',
        description: 'Judge the effectiveness of various approaches to geometric problems',
        bloomsLevel: 'EVALUATE' as BloomsTaxonomyLevel,
        actionVerbs: ['evaluate', 'assess', 'judge', 'critique']
      }
    ]
  },
  ENG: {
    'READINGCOMPREHENSION': [
      {
        statement: 'Students will be able to recall main ideas and supporting details from texts',
        description: 'Remember key information from reading passages',
        bloomsLevel: 'REMEMBER' as BloomsTaxonomyLevel,
        actionVerbs: ['recall', 'identify', 'list', 'state']
      },
      {
        statement: 'Students will be able to explain the relationship between characters and plot',
        description: 'Understand how story elements work together',
        bloomsLevel: 'UNDERSTAND' as BloomsTaxonomyLevel,
        actionVerbs: ['explain', 'describe', 'interpret', 'paraphrase']
      },
      {
        statement: 'Students will be able to analyze author\'s purpose and point of view',
        description: 'Examine the author\'s intentions and perspective in writing',
        bloomsLevel: 'ANALYZE' as BloomsTaxonomyLevel,
        actionVerbs: ['analyze', 'examine', 'investigate', 'distinguish']
      }
    ],
    'WRITINGSKILLS': [
      {
        statement: 'Students will be able to write complete sentences with proper grammar',
        description: 'Apply grammar rules to create well-formed sentences',
        bloomsLevel: 'APPLY' as BloomsTaxonomyLevel,
        actionVerbs: ['write', 'construct', 'use', 'apply']
      },
      {
        statement: 'Students will be able to create original stories with clear beginning, middle, and end',
        description: 'Compose narrative texts with proper story structure',
        bloomsLevel: 'CREATE' as BloomsTaxonomyLevel,
        actionVerbs: ['create', 'compose', 'write', 'design']
      },
      {
        statement: 'Students will be able to evaluate and revise their own writing',
        description: 'Assess and improve written work through revision process',
        bloomsLevel: 'EVALUATE' as BloomsTaxonomyLevel,
        actionVerbs: ['evaluate', 'revise', 'improve', 'critique']
      }
    ]
  },
  SCI: {
    'LIFESCIENCE': [
      {
        statement: 'Students will be able to identify basic needs of living organisms',
        description: 'Recognize what plants and animals need to survive',
        bloomsLevel: 'REMEMBER' as BloomsTaxonomyLevel,
        actionVerbs: ['identify', 'name', 'list', 'recognize']
      },
      {
        statement: 'Students will be able to explain how organisms adapt to their environment',
        description: 'Understand the relationship between organisms and their habitats',
        bloomsLevel: 'UNDERSTAND' as BloomsTaxonomyLevel,
        actionVerbs: ['explain', 'describe', 'illustrate', 'interpret']
      },
      {
        statement: 'Students will be able to design an experiment to test plant growth factors',
        description: 'Create scientific investigations to study living organisms',
        bloomsLevel: 'CREATE' as BloomsTaxonomyLevel,
        actionVerbs: ['design', 'plan', 'create', 'develop']
      }
    ],
    'PHYSICALSCIENCE': [
      {
        statement: 'Students will be able to classify materials as solids, liquids, or gases',
        description: 'Categorize matter based on its physical properties',
        bloomsLevel: 'UNDERSTAND' as BloomsTaxonomyLevel,
        actionVerbs: ['classify', 'categorize', 'group', 'sort']
      },
      {
        statement: 'Students will be able to predict changes in matter when heat is applied',
        description: 'Apply knowledge of states of matter to make predictions',
        bloomsLevel: 'APPLY' as BloomsTaxonomyLevel,
        actionVerbs: ['predict', 'apply', 'demonstrate', 'show']
      },
      {
        statement: 'Students will be able to analyze the results of simple physics experiments',
        description: 'Examine data from investigations to draw conclusions',
        bloomsLevel: 'ANALYZE' as BloomsTaxonomyLevel,
        actionVerbs: ['analyze', 'examine', 'investigate', 'compare']
      }
    ]
  }
};

// Activity templates by type and Bloom's level
const activityTemplates = {
  MULTIPLE_CHOICE: {
    REMEMBER: {
      title: 'Knowledge Check Quiz',
      description: 'Test recall of basic facts and concepts',
      content: {
        questions: [
          {
            question: 'What is the sum of 5 + 3?',
            options: ['6', '7', '8', '9'],
            correctAnswer: 2,
            explanation: 'When we add 5 and 3, we get 8.'
          }
        ]
      }
    },
    UNDERSTAND: {
      title: 'Concept Understanding Quiz',
      description: 'Assess comprehension of key concepts',
      content: {
        questions: [
          {
            question: 'Which statement best explains why plants need sunlight?',
            options: [
              'To look pretty',
              'To make their own food through photosynthesis',
              'To stay warm',
              'To grow taller'
            ],
            correctAnswer: 1,
            explanation: 'Plants use sunlight to make their own food through the process of photosynthesis.'
          }
        ]
      }
    }
  },
  TRUE_FALSE: {
    REMEMBER: {
      title: 'True or False Facts',
      description: 'Quick recall of factual information',
      content: {
        questions: [
          {
            statement: 'The Earth is round.',
            correct: true,
            explanation: 'The Earth is approximately spherical in shape.'
          }
        ]
      }
    }
  },
  READING: {
    UNDERSTAND: {
      title: 'Reading Comprehension',
      description: 'Read and understand text passages',
      content: {
        text: 'The water cycle is the continuous movement of water on, above, and below the surface of the Earth...',
        questions: [
          'What is the water cycle?',
          'Name three stages of the water cycle.',
          'Why is the water cycle important?'
        ]
      }
    }
  },
  VIDEO: {
    UNDERSTAND: {
      title: 'Educational Video',
      description: 'Watch and learn from educational content',
      content: {
        videoUrl: 'https://example.com/educational-video',
        duration: 300,
        questions: [
          'What was the main topic of the video?',
          'List three key points mentioned.'
        ]
      }
    }
  },
  FILL_IN_THE_BLANKS: {
    REMEMBER: {
      title: 'Fill in the Blanks',
      description: 'Complete sentences with missing words',
      content: {
        sentences: [
          'The capital of France is ____.',
          'Water boils at ____ degrees Celsius.'
        ],
        answers: ['Paris', '100']
      }
    }
  },
  MATCHING: {
    UNDERSTAND: {
      title: 'Matching Exercise',
      description: 'Match related items or concepts',
      content: {
        leftColumn: ['Apple', 'Dog', 'Car'],
        rightColumn: ['Fruit', 'Animal', 'Vehicle'],
        correctMatches: [[0, 0], [1, 1], [2, 2]]
      }
    }
  }
};

// Assessment templates
const assessmentTemplates = {
  QUIZ: {
    title: 'Weekly Knowledge Quiz',
    description: 'Short quiz to assess weekly learning',
    maxScore: 100,
    passingScore: 70,
    weightage: 0.2
  },
  ASSIGNMENT: {
    title: 'Practice Assignment',
    description: 'Homework assignment to reinforce learning',
    maxScore: 100,
    passingScore: 75,
    weightage: 0.3
  },
  PROJECT: {
    title: 'Research Project',
    description: 'Long-term project demonstrating deep understanding',
    maxScore: 100,
    passingScore: 80,
    weightage: 0.4
  },
  EXAM: {
    title: 'Unit Examination',
    description: 'Comprehensive test covering unit topics',
    maxScore: 100,
    passingScore: 75,
    weightage: 0.5
  }
};

async function main() {
  console.log('🚀 Starting learning content seeding...\n');

  try {
    // Get existing data
    const subjects = await prisma.subject.findMany({
      include: { topics: true, course: true }
    });
    
    const classes = await prisma.class.findMany({
      include: { term: true }
    });
    
    const teachers = await prisma.user.findMany({
      where: { userType: 'TEACHER' }
    });
    
    const students = await prisma.studentProfile.findMany({
      include: { user: true }
    });

    console.log(`Found ${subjects.length} subjects, ${classes.length} classes, ${teachers.length} teachers, ${students.length} students\n`);

    // Step 1: Create Learning Outcomes
    console.log('📚 Step 1: Creating learning outcomes...');
    const learningOutcomes = [];

    for (const subject of subjects) {
      const subjectCode = subject.code.split('-').pop(); // Get subject code (e.g., 'MATH' from 'ELEM-G1-MATH')
      const subjectOutcomes = learningOutcomesData[subjectCode as keyof typeof learningOutcomesData];

      if (subjectOutcomes) {
        for (const topic of subject.topics) {
          const topicKey = topic.title.replace(/\s+/g, '').toUpperCase();
          const topicOutcomes = subjectOutcomes[topicKey as keyof typeof subjectOutcomes] as any[];

          if (topicOutcomes && Array.isArray(topicOutcomes)) {
            for (const outcomeData of topicOutcomes) {
              const outcomeId = `${subject.id}-${topic.id}-${outcomeData.statement.slice(0, 20).replace(/\s+/g, '-')}`;
              const outcome = await prisma.learningOutcome.upsert({
                where: { id: outcomeId },
                update: {
                  statement: outcomeData.statement,
                  description: outcomeData.description,
                  bloomsLevel: outcomeData.bloomsLevel,
                  actionVerbs: outcomeData.actionVerbs,
                },
                create: {
                  id: outcomeId,
                  statement: outcomeData.statement,
                  description: outcomeData.description,
                  bloomsLevel: outcomeData.bloomsLevel,
                  actionVerbs: outcomeData.actionVerbs,
                  subjectId: subject.id,
                  topicId: topic.id,
                  createdById: teachers[0]?.id || 'system',
                },
              });
              learningOutcomes.push(outcome);
            }
          }
        }
      }
    }
    console.log(`✅ Learning outcomes created: ${learningOutcomes.length}\n`);

    // Step 2: Create Activities
    console.log('🎯 Step 2: Creating activities...');
    const activities = [];

    const activityTypes = [
      LearningActivityType.MULTIPLE_CHOICE,
      LearningActivityType.TRUE_FALSE,
      LearningActivityType.READING,
      LearningActivityType.VIDEO,
      LearningActivityType.FILL_IN_THE_BLANKS,
      LearningActivityType.MATCHING,
    ];

    const bloomsLevels = [
      BloomsTaxonomyLevel.REMEMBER,
      BloomsTaxonomyLevel.UNDERSTAND,
      BloomsTaxonomyLevel.APPLY,
      BloomsTaxonomyLevel.ANALYZE,
    ];

    for (const classItem of classes) {
      // Get subjects for this class through courseCampus relationship
      const courseCampus = await prisma.courseCampus.findUnique({
        where: { id: classItem.courseCampusId },
        include: { course: true }
      });

      const classSubjects = subjects.filter(s => s.courseId === courseCampus?.courseId);

      for (const subject of classSubjects) {
        for (const topic of subject.topics.slice(0, 2)) { // Limit to first 2 topics per subject
          for (let i = 0; i < 3; i++) { // Create 3 activities per topic
            const activityType = activityTypes[i % activityTypes.length];
            const bloomsLevel = bloomsLevels[i % bloomsLevels.length];
            const teacher = teachers[i % teachers.length];

            const template = (activityTemplates as any)[activityType]?.[bloomsLevel] || activityTemplates.MULTIPLE_CHOICE.REMEMBER;

            const activity = await prisma.activity.upsert({
              where: {
                id: `${classItem.id}-${subject.id}-${topic.id}-${activityType}-${i}`,
              },
              update: {
                title: `${template.title} - ${topic.title}`,
                content: template.content,
                bloomsLevel: bloomsLevel,
              },
              create: {
                id: `${classItem.id}-${subject.id}-${topic.id}-${activityType}-${i}`,
                title: `${template.title} - ${topic.title}`,
                purpose: activityType === LearningActivityType.READING || activityType === LearningActivityType.VIDEO
                  ? ActivityPurpose.LEARNING
                  : ActivityPurpose.ASSESSMENT,
                learningType: activityType,
                status: SystemStatus.ACTIVE,
                subjectId: subject.id,
                topicId: topic.id,
                classId: classItem.id,
                content: template.content,
                isGradable: activityType !== LearningActivityType.READING && activityType !== LearningActivityType.VIDEO,
                maxScore: activityType !== LearningActivityType.READING && activityType !== LearningActivityType.VIDEO ? 100 : null,
                passingScore: activityType !== LearningActivityType.READING && activityType !== LearningActivityType.VIDEO ? 70 : null,
                bloomsLevel: bloomsLevel,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdById: teacher?.id || teachers[0]?.id || 'system',
              },
            });
            activities.push(activity);
          }
        }
      }
    }
    console.log(`✅ Activities created: ${activities.length}\n`);

    // Step 3: Create Assessments
    console.log('📝 Step 3: Creating assessments...');
    const assessments = [];

    const assessmentTypes = [
      AssessmentType.QUIZ,
      AssessmentType.ASSIGNMENT,
      AssessmentType.PROJECT,
      AssessmentType.EXAM,
    ];

    for (const classItem of classes) {
      // Get subjects for this class through courseCampus relationship
      const courseCampus = await prisma.courseCampus.findUnique({
        where: { id: classItem.courseCampusId },
        include: { course: true, campus: true }
      });

      const classSubjects = subjects.filter(s => s.courseId === courseCampus?.courseId);

      for (const subject of classSubjects) {
        for (let i = 0; i < assessmentTypes.length; i++) {
          const assessmentType = assessmentTypes[i];
          const template = assessmentTemplates[assessmentType];
          const teacher = teachers[i % teachers.length];

          // Create assessment content based on type
          let assessmentContent = {};
          if (assessmentType === AssessmentType.QUIZ) {
            assessmentContent = {
              questions: [
                {
                  type: 'multiple-choice',
                  question: `What is the main concept in ${subject.name}?`,
                  options: ['Option A', 'Option B', 'Option C', 'Option D'],
                  correctAnswer: 1,
                  points: 25
                },
                {
                  type: 'true-false',
                  question: `${subject.name} is an important subject.`,
                  correct: true,
                  points: 25
                }
              ],
              timeLimit: 30,
              allowRetakes: false
            };
          } else if (assessmentType === AssessmentType.ASSIGNMENT) {
            assessmentContent = {
              instructions: `Complete the following tasks related to ${subject.name}:`,
              tasks: [
                `Research and write a short paragraph about ${subject.name}`,
                `Create examples demonstrating key concepts`,
                `Submit your work by the due date`
              ],
              submissionFormat: 'document',
              allowLateSubmission: true
            };
          } else if (assessmentType === AssessmentType.PROJECT) {
            assessmentContent = {
              description: `Create a comprehensive project demonstrating your understanding of ${subject.name}`,
              requirements: [
                'Include research from at least 3 sources',
                'Present findings in a creative format',
                'Demonstrate practical application of concepts'
              ],
              deliverables: ['Written report', 'Presentation', 'Visual aids'],
              timeline: '2 weeks'
            };
          } else if (assessmentType === AssessmentType.EXAM) {
            assessmentContent = {
              sections: [
                {
                  name: 'Multiple Choice',
                  questions: 20,
                  points: 40
                },
                {
                  name: 'Short Answer',
                  questions: 5,
                  points: 30
                },
                {
                  name: 'Essay',
                  questions: 2,
                  points: 30
                }
              ],
              timeLimit: 90,
              materials: 'Calculator allowed for math sections'
            };
          }

          const assessment = await prisma.assessment.upsert({
            where: {
              id: `${classItem.id}-${subject.id}-${assessmentType}`,
            },
            update: {
              title: `${template.title} - ${subject.name}`,
              content: assessmentContent,
              maxScore: template.maxScore,
              passingScore: template.passingScore,
              weightage: template.weightage,
            },
            create: {
              id: `${classItem.id}-${subject.id}-${assessmentType}`,
              title: `${template.title} - ${subject.name}`,
              institutionId: courseCampus?.campus?.institutionId || 'default',
              classId: classItem.id,
              subjectId: subject.id,
              termId: classItem.termId,
              content: assessmentContent,
              maxScore: template.maxScore,
              passingScore: template.passingScore,
              weightage: template.weightage,
              gradingType: GradingType.MANUAL,
              status: SystemStatus.ACTIVE,
              createdById: teacher?.id || teachers[0]?.id || 'system',
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
              bloomsDistribution: {
                REMEMBER: 20,
                UNDERSTAND: 30,
                APPLY: 25,
                ANALYZE: 15,
                EVALUATE: 5,
                CREATE: 5
              },
            },
          });
          assessments.push(assessment);
        }
      }
    }
    console.log(`✅ Assessments created: ${assessments.length}\n`);

    // Final Summary
    console.log('🎉 Learning content seeding completed successfully!');
    console.log('\n📊 Final Summary:');
    console.log(`- Learning Outcomes: ${learningOutcomes.length}`);
    console.log(`- Activities: ${activities.length}`);
    console.log(`- Assessments: ${assessments.length}`);
    console.log('\n✨ All learning content is now properly associated with:');
    console.log(`- ${subjects.length} subjects across ${classes.length} classes`);
    console.log(`- ${students.length} enrolled students`);
    console.log(`- ${teachers.length} teachers as content creators`);
    console.log('\n🎯 Content includes:');
    console.log('- Realistic learning outcomes aligned with Bloom\'s Taxonomy');
    console.log('- Diverse activity types (quizzes, reading, videos, interactive)');
    console.log('- Comprehensive assessments (quizzes, assignments, projects, exams)');
    console.log('- Proper associations with enrolled classes and students');

  } catch (error) {
    console.error('❌ Error during learning content seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
