import AppError from "../utils/appError.js";
import Student from "../models/Student.js";
import { hashPoseidonFields } from "../utils/poseidonHash.js";
import { generateTemporaryPassword } from "../utils/password.js";
import { sendCredentialsEmail } from "./emailService.js";

export function normalizeStudentInput(studentPayload) {
  return {
    name: String(studentPayload.name ?? "").trim(),
    email: String(studentPayload.email ?? "").trim().toLowerCase(),
    rollNo: String(studentPayload.rollNo ?? "").trim(),
    programme: String(studentPayload.programme ?? "").trim(),
    contactNo: String(studentPayload.contactNo ?? "").trim(),
  };
}

export function sanitizeStudent(student) {
  return {
    id: student._id.toString(),
    name: student.name,
    email: student.email,
    rollNo: student.rollNo,
    programme: student.programme,
    contactNo: student.contactNo,
    hashedData: student.hashedData,
    emailSent: student.emailSent,
    emailSentAt: student.emailSentAt,
    createdAt: student.createdAt,
  };
}

export async function listStudents() {
  const students = await Student.find().sort({ createdAt: -1 });
  return students.map(sanitizeStudent);
}

export async function findDuplicateStudent({ email, rollNo }) {
  return Student.findOne({
    $or: [{ email }, { rollNo }],
  });
}

export async function buildStudentRecord(studentPayload) {
  const normalizedStudent = normalizeStudentInput(studentPayload);
  const temporaryPassword = generateTemporaryPassword();
  const hashedData = await hashPoseidonFields([
    normalizedStudent.name,
    normalizedStudent.email,
    normalizedStudent.rollNo,
    normalizedStudent.programme,
    normalizedStudent.contactNo,
  ]);

  return {
    ...normalizedStudent,
    hashedData,
    password: temporaryPassword,
  };
}

export async function createStudent(studentPayload) {
  const record = await buildStudentRecord(studentPayload);
  const student = await Student.create({
    name: record.name,
    email: record.email,
    rollNo: record.rollNo,
    programme: record.programme,
    contactNo: record.contactNo,
    hashedData: record.hashedData,
    password: record.password,
    emailSent: false,
    emailSentAt: null,
  });

  return {
    student: sanitizeStudent(student),
  };
}

export async function buildBulkStudents(studentRows) {
  const prepared = [];

  for (const row of studentRows) {
    const record = await buildStudentRecord(row);
    prepared.push(record);
  }

  return prepared;
}

export async function insertBulkStudents(preparedStudents) {
  const studentsToInsert = preparedStudents.map((student) => ({
    ...student,
    emailSent: false,
    emailSentAt: null,
  }));
  const insertedStudents = await Student.insertMany(studentsToInsert, { ordered: true });

  return {
    insertedStudents: insertedStudents.map(sanitizeStudent),
  };
}

export async function sendEmailsForStudents(studentIds) {
  if (!Array.isArray(studentIds) || !studentIds.length) {
    throw new AppError("At least one student must be selected.", 400);
  }

  const students = await Student.find({ _id: { $in: studentIds } }).sort({ createdAt: -1 });

  if (!students.length) {
    throw new AppError("No matching students were found.", 404);
  }

  const results = await Promise.all(
    students.map(async (student) => {
      const studentId = student._id.toString();

      if (student.emailSent) {
        return {
          studentId,
          name: student.name,
          email: student.email,
          status: "skipped",
          message: "Email already sent.",
        };
      }

      try {
        await sendCredentialsEmail({
          to: student.email,
          name: student.name,
          email: student.email,
          password: student.password,
        });

        student.emailSent = true;
        student.emailSentAt = new Date();
        await student.save();

        return {
          studentId,
          name: student.name,
          email: student.email,
          status: "sent",
          message: "Credentials sent successfully.",
        };
      } catch (error) {
        return {
          studentId,
          name: student.name,
          email: student.email,
          status: "failed",
          message: error.message || "Email delivery failed.",
        };
      }
    })
  );

  const summary = {
    sent: [],
    skipped: [],
    failed: [],
  };

  for (const result of results) {
    if (result.status === "sent") {
      summary.sent.push(result.studentId);
      continue;
    }

    if (result.status === "skipped") {
      summary.skipped.push({ studentId: result.studentId, reason: result.message });
      continue;
    }

    summary.failed.push({ studentId: result.studentId, reason: result.message });
  }

  return {
    summary,
    details: results,
  };
}