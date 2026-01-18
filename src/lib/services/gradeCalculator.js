import Submission from "@/lib/models/Submission";
import ExamResult from "@/lib/models/ExamResult";
import Exam from "@/lib/models/Exam";
import Tugas from "@/lib/models/Tugas";

/**
 * Calculates the final grade for a student in a specific subject and academic year
 */
export async function calculateStudentGrade(studentId, subjectId, classId, academicYearId, semester) {
    // 1. Fetch all Tasks (Tugas) for this class/subject/year
    // Note: Tugas model might need academic_year/semester filter, or we rely on the class linkage
    // Assuming Tugas is linked to a Kelas, and Kelas is linked to AcademicYear

    // Find all Tugas IDs for this context
    const tugasList = await Tugas.find({
        kelas_id: classId,
        mapel_id: subjectId
    }).select('_id');
    const tugasIds = tugasList.map(t => t._id);

    // Get Submissions for these tasks
    const submissions = await Submission.find({
        student_id: studentId,
        tugas_id: { $in: tugasIds }
    });

    // Calculate Tugas Avg
    let tugasTotal = 0;
    if (submissions.length > 0) {
        tugasTotal = submissions.reduce((sum, sub) => sum + (sub.nilai || 0), 0) / submissions.length;
    }

    // 2. Fetch Exams (UH, UTS, UAS)
    const exams = await Exam.find({
        class_id: classId,
        subject_id: subjectId,
        academic_year_id: academicYearId,
        semester: semester
    });

    const uhExams = exams.filter(e => e.type === 'UH');
    const utsExams = exams.filter(e => e.type === 'UTS');
    const uasExams = exams.filter(e => e.type === 'UAS');

    // Helper to get avg score for a list of exams
    const getExamAvg = async (examList) => {
        if (examList.length === 0) return 0;
        const examIds = examList.map(e => e._id);
        const results = await ExamResult.find({
            student_id: studentId,
            exam_id: { $in: examIds }
        });

        if (results.length === 0) return 0;
        // Map results to exams to handle missing scores (treat as 0? or ignore?)
        // Usually treat missing as 0 if the exam has passed

        const total = results.reduce((sum, res) => sum + res.score, 0);
        return total / examList.length; // Divide by total exams, not just submitted ones (strict)
    };

    const uhAvg = await getExamAvg(uhExams);
    const utsAvg = await getExamAvg(utsExams);
    const uasAvg = await getExamAvg(uasExams);

    // 3. Calculate Final Score based on weights
    // Fetch from Settings or use Default
    let weights = {
        tugas: 20,
        uh: 30,
        uts: 20,
        uas: 30
    };

    try {
        const Setting = (await import("@/lib/models/Setting")).default;
        const weightSetting = await Setting.findOne({ key: "grade_weights" });
        if (weightSetting && weightSetting.value) {
            weights = weightSetting.value;
        }
    } catch (e) {
        console.error("Error fetching grade weights, using defaults", e);
    }

    // Normalize to decimals (e.g. 20 -> 0.2)
    const wTugas = weights.tugas / 100;
    const wUH = weights.uh / 100;
    const wUTS = weights.uts / 100;
    const wUAS = weights.uas / 100;

    const finalScore = (tugasTotal * wTugas) +
        (uhAvg * wUH) +
        (utsAvg * wUTS) +
        (uasAvg * wUAS);

    // 4. Determine Letter Grade
    let letter = 'E';
    if (finalScore >= 90) letter = 'A';
    else if (finalScore >= 80) letter = 'B';
    else if (finalScore >= 70) letter = 'C';
    else if (finalScore >= 60) letter = 'D';

    return {
        components: {
            tugas_avg: parseFloat(tugasTotal.toFixed(2)),
            uh_avg: parseFloat(uhAvg.toFixed(2)),
            uts: parseFloat(utsAvg.toFixed(2)),
            uas: parseFloat(uasAvg.toFixed(2))
        },
        final_score: parseFloat(finalScore.toFixed(2)),
        letter_grade: letter
    };
}
