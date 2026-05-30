import multer from "multer";

import AppError from "../utils/appError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateStudentPayload } from "../validators/studentValidator.js";
import { parseStudentsFromWorkbook } from "../utils/excelParser.js";
import {
  buildBulkStudents,
  createStudent,
  findDuplicateStudent,
  insertBulkStudents,
  listStudents,
  normalizeStudentInput,
  sanitizeStudent,
  sendEmailsForStudents,
} from "../services/studentService.js";
import Student from "../models/Student.js";
import Joi from "joi";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

function extractValidationMessage(error) {
  return error.details.map((detail) => detail.message).join(", ");
}

function validateExcelRows(rows) {
  const validRows = [];
  const errors = [];

  rows.forEach((row) => {
    const { error, value } = validateStudentPayload(row);

    if (error) {
      errors.push({ row: row.rowNumber, message: extractValidationMessage(error) });
      return;
    }

    validRows.push(normalizeStudentInput(value));
  });

  return { validRows, errors };
}

const sendEmailSchema = Joi.object({
  studentIds: Joi.array().items(Joi.string().trim().required()).min(1).required(),
});

export const uploadMiddleware = upload.single("file");

export const getStudents = asyncHandler(async (_req, res) => {
  const students = await listStudents();

  res.json({
    status: "success",
    count: students.length,
    students,
  });
});

export const addStudent = asyncHandler(async (req, res) => {
  const { error, value } = validateStudentPayload(req.body);

  if (error) {
    throw new AppError("Validation failed", 400, error.details);
  }

  const normalizedValue = normalizeStudentInput(value);

  const duplicate = await findDuplicateStudent(normalizedValue);

  if (duplicate) {
    throw new AppError("A student with the same email or roll number already exists.", 409);
  }

  const result = await createStudent(normalizedValue);

  res.status(201).json({
    status: "success",
    message: "Student created successfully. You can send credentials from the dashboard.",
    student: result.student,
  });
});

export const uploadStudents = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("Please upload an Excel file.", 400);
  }

  const parsedRows = parseStudentsFromWorkbook(req.file.buffer);
  const { validRows, errors } = validateExcelRows(parsedRows);

  if (errors.length) {
    throw new AppError("One or more rows failed validation.", 400, { rowErrors: errors });
  }

  if (!validRows.length) {
    throw new AppError("The uploaded workbook does not contain any student rows.", 400);
  }

  const duplicateRows = [];
  const seenEmails = new Set();
  const seenRollNos = new Set();

  validRows.forEach((row) => {
    const normalizedEmail = row.email.toLowerCase();

    if (seenEmails.has(normalizedEmail) || seenRollNos.has(row.rollNo)) {
      duplicateRows.push({ email: row.email, rollNo: row.rollNo });
      return;
    }

    seenEmails.add(normalizedEmail);
    seenRollNos.add(row.rollNo);
  });

  if (duplicateRows.length) {
    throw new AppError("Duplicate email or roll number found inside the uploaded file.", 409, duplicateRows);
  }

  const databaseMatches = await Student.find({
    $or: validRows.flatMap((row) => [
      { email: row.email },
      { rollNo: row.rollNo },
    ]),
  }).select("email rollNo");

  if (databaseMatches.length) {
    throw new AppError("Some uploaded students already exist in the database.", 409, {
      duplicates: databaseMatches,
    });
  }

  const preparedStudents = await buildBulkStudents(validRows);
  const result = await insertBulkStudents(preparedStudents);

  res.status(201).json({
    status: "success",
    message: "Students uploaded successfully.",
    count: result.insertedStudents.length,
    students: result.insertedStudents,
  });
});

export const loginStudent = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const student = await Student.findOne({ email: String(email).toLowerCase().trim() });

  if (!student || student.password !== String(password)) {
    throw new AppError("Invalid email or password.", 401);
  }

  res.json({
    status: "success",
    student: sanitizeStudent(student),
  });
});

export const sendStudentEmails = asyncHandler(async (req, res) => {
  const { error, value } = sendEmailSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    throw new AppError("Please select at least one student.", 400, error.details);
  }

  const result = await sendEmailsForStudents(value.studentIds);

  res.status(200).json({
    status: "success",
    message: "Email processing finished.",
    summary: result.summary,
    details: result.details,
  });
});