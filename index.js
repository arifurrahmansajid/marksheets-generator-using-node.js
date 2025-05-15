const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer'); // No .default needed for v8+
const chalk = require('chalk');
const figlet = require('figlet');

// Display welcome message
console.log(
    chalk.yellow(
        figlet.textSync('Marksheet Generator', { horizontalLayout: 'full' })
    )
);

// Configuration
const CONFIG = {
    subjects: ['Math', 'Science', 'English', 'History', 'Computer'],
    maxMarks: 100,
    passingPercentage: 40,
    outputDir: 'marksheets',
    creditHours: [5, 5, 4, 4, 4] // Credit hours for each subject
};

// Grade to GPA mapping
const GRADE_TO_GPA = {
    'A+': 5.0,
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D+': 1.3,
    'D': 1.0,
    'F': 0.0
};

// Calculate grade based on percentage
function calculateGrade(percentage) {
    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'A-';
    if (percentage >= 57) return 'B+';
    if (percentage >= 53) return 'B';
    if (percentage >= 50) return 'B-';
    if (percentage >= 47) return 'C+';
    if (percentage >= 43) return 'C';
    if (percentage >= 40) return 'C-';
    if (percentage >= 37) return 'D+';
    if (percentage >= 33) return 'D';
    if (percentage >= 30) return 'D-';
    return 'F';
}

// Calculate GPA
function calculateGPA(subjectGrades) {
    let totalQualityPoints = 0;
    let totalCreditHours = 0;

    subjectGrades.forEach((grade, index) => {
        totalQualityPoints += GRADE_TO_GPA[grade] * CONFIG.creditHours[index];
        totalCreditHours += CONFIG.creditHours[index];
    });

    return totalQualityPoints / totalCreditHours;
}

async function generateMarksheet() {
    try {
        // Create output directory if it doesn't exist
        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir);
        }

        // Get student details
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Enter student name:',
                validate: input => !!input.trim() || 'Name cannot be empty'
            },
            {
                type: 'input',
                name: 'rollNumber',
                message: 'Enter roll number:',
                validate: input => !!input.trim() || 'Roll number cannot be empty'
            },
            {
                type: 'input',
                name: 'className',
                message: 'Enter class:',
                validate: input => !!input.trim() || 'Class cannot be empty'
            },
            {
                type: 'input',
                name: 'section',
                message: 'Enter section:',
                default: 'A'
            },
            ...CONFIG.subjects.map(subject => ({
                type: 'number',
                name: `${subject.toLowerCase()}Marks`,
                message: `Enter marks for ${subject} (out of ${CONFIG.maxMarks}):`,
                validate: input =>
                    (input >= 0 && input <= CONFIG.maxMarks) ||
                    `Marks must be between 0 and ${CONFIG.maxMarks}`
            }))
        ]);

        // Extract marks from answers
        const marks = CONFIG.subjects.map(subject =>
            answers[`${subject.toLowerCase()}Marks`]
        );

        // Calculate results
        const totalMarks = marks.reduce((sum, mark) => sum + mark, 0);
        const percentage = (totalMarks / (CONFIG.subjects.length * CONFIG.maxMarks)) * 100;
        const subjectGrades = marks.map(mark =>
            calculateGrade((mark / CONFIG.maxMarks) * 100)
        );
        const gpa = calculateGPA(subjectGrades);
        const passed = percentage >= CONFIG.passingPercentage;

        // Generate marksheet content
        const marksheet = `
=============================================
              STUDENT MARKSHEET              
=============================================
Name: ${answers.name}
Roll Number: ${answers.rollNumber}
Class: ${answers.className}
Section: ${answers.section}

SUBJECT\t\tMARKS\tGRADE\tCREDIT HOURS
${CONFIG.subjects.map((subject, i) =>
            `${subject.padEnd(15)}\t${marks[i]}\t${subjectGrades[i]}\t${CONFIG.creditHours[i]}`
        ).join('\n')}

TOTAL MARKS: ${totalMarks} / ${CONFIG.subjects.length * CONFIG.maxMarks}
PERCENTAGE: ${percentage.toFixed(2)}%
GPA: ${gpa.toFixed(2)}
STATUS: ${passed ? chalk.green('PASS') : chalk.red('FAIL')}
=============================================
Generated on: ${new Date().toLocaleString()}
`;

        console.log(chalk.green('\nGenerated Marksheet:'));
        console.log(marksheet);

        // Save to file
        const filename = `${answers.name.replace(/\s+/g, '_')}_${answers.rollNumber}.txt`;
        fs.writeFileSync(path.join(CONFIG.outputDir, filename), marksheet);
        console.log(chalk.blue(`\nMarksheet saved to ${path.join(CONFIG.outputDir, filename)}`));

    } catch (error) {
        console.error(chalk.red('Error:', error.message));
    } finally {
        console.log(chalk.yellow('\nThank you for using Marksheet Generator!'));
    }
}

// Start the application
generateMarksheet();