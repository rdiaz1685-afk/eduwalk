export const danielsonFramework = {
    id: 'danielson-2013',
    title: 'Danielson Framework for Teaching',
    description: 'Evidence-based component framework for teacher evaluation.',
    domains: [
        {
            id: 'd1',
            title: 'Domain 1: Planning and Preparation',
            indicators: [
                { id: '1a', title: 'Demonstrating Knowledge of Content and Pedagogy', description: 'Knowledge of content and the structure of the discipline.' },
                { id: '1b', title: 'Demonstrating Knowledge of Students', description: 'Knowledge of child development, learning process, and students\' skills.' },
                { id: '1c', title: 'Setting Instructional Outcomes', description: 'Value, sequence, alignment, and clarity of outcomes.' },
                { id: '1d', title: 'Demonstrating Knowledge of Resources', description: 'Resources for classroom use, students, and to extend knowledge.' },
                { id: '1e', title: 'Designing Coherent Instruction', description: 'Learning activities, instructional materials, and lesson structure.' },
                { id: '1f', title: 'Designing Student Assessments', description: 'Congruence with outcomes and use for planning.' },
            ]
        },
        {
            id: 'd2',
            title: 'Domain 2: The Classroom Environment',
            indicators: [
                { id: '2a', title: 'Creating an Environment of Respect and Rapport', description: 'Teacher interactions with students and student interactions.' },
                { id: '2b', title: 'Establishing a Culture for Learning', description: 'Importance of content, expectations for achievement.' },
                { id: '2c', title: 'Managing Classroom Procedures', description: 'Instructional groups, transitions, and materials.' },
                { id: '2d', title: 'Managing Student Behavior', description: 'Expectations, monitoring behavior, and response.' },
                { id: '2e', title: 'Organizing Physical Space', description: 'Safety, accessibility, and arrangement of furniture.' },
            ]
        },
        {
            id: 'd3',
            title: 'Domain 3: Instruction',
            indicators: [
                { id: '3a', title: 'Communicating with Students', description: 'Expectations for learning, directions, and content.' },
                { id: '3b', title: 'Using Questioning and Discussion Techniques', description: 'Quality of questions and student participation.' },
                { id: '3c', title: 'Engaging Students in Learning', description: 'Activities, grouping, materials, and pacing.' },
                { id: '3d', title: 'Using Assessment in Instruction', description: 'Assessment criteria, monitoring, and feedback.' },
                { id: '3e', title: 'Demonstating Flexibility and Responsiveness', description: 'Lesson adjustment and response to students.' },
            ]
        },
        {
            id: 'd4',
            title: 'Domain 4: Professional Responsibilities',
            indicators: [
                { id: '4a', title: 'Reflecting on Teaching', description: 'Accuracy and use in future teaching.' },
                { id: '4b', title: 'Maintaining Accurate Records', description: 'Student completion, progress, and non-instructional records.' },
                { id: '4c', title: 'Communicating with Families', description: 'Information about the program and individual students.' },
                { id: '4d', title: 'Participating in a Professional Community', description: 'Relationships with colleagues and service to the school.' },
                { id: '4e', title: 'Growing and Developing Professionally', description: 'Enhancement of content knowledge and pedagogical skill.' },
                { id: '4f', title: 'Showing Professionalism', description: 'Integrity, advocacy, and decision making.' },
            ]
        }
    ]
};

export const templates = [
    { id: 'danielson', name: 'Danielson Framework', type: 'Standard', items: 22 },
    { id: 'rapid', name: '5-Minute Walkthrough', type: 'Quick', items: 5 },
    { id: 'district', name: 'District Custom Rubric', type: 'Custom', items: 10 },
];
