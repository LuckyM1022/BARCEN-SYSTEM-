const { ObjectId } = require('mongodb');

function isValidObjectId(value) {
  return ObjectId.isValid(value) && String(new ObjectId(value)) === value;
}

function sanitizeRolePayload(body) {
  return {
    name: String(body.name || '').trim(),
    access: String(body.access || '').trim(),
    members: Math.max(1, Number(body.members) || 1),
  };
}

function sanitizeUserPayload(body) {
  return {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    phoneNumber: String(body.phoneNumber || '').trim(),
    role: String(body.role || '').trim(),
  };
}

module.exports = {
  isValidObjectId,
  sanitizeRolePayload,
  sanitizeUserPayload,
};
