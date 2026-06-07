import Joi from "joi";

export const studentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().trim().email().required(),
  rollNo: Joi.string().trim().min(1).max(50).required(),
  programme: Joi.string().trim().min(2).max(120).required(),
  contactNo: Joi.string().trim().min(5).max(20).required(),
  dob: Joi.string().trim().allow("").optional(),
});

export function validateStudentPayload(payload) {
  return studentSchema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
  });
}