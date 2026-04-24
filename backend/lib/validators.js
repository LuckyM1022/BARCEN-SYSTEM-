import { ObjectId } from 'mongodb';

export const isValidObjectId = (value) => {
  return ObjectId.isValid(value) && String(new ObjectId(value)) === value;
};

export const sanitizeRolePayload = (body) => {
  return {
    name: String(body.name || '').trim(),
    access: String(body.access || '').trim(),
    members: Math.max(1, Number(body.members) || 1),
  };
};

export const sanitizeUserPayload = (body) => {
  return {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    phoneNumber: String(body.phoneNumber || '').trim(),
    role: String(body.role || '').trim(),
  };
};

export const isStrongPassword = (value) => {
  const password = String(value || '');
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/u.test(password);
};
