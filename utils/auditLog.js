const AuditLog = require('../models/AuditLog');

exports.createAuditLog = async ({
  action,
  performedBy,
  targetUser = null,
  targetInventory = null,
  targetRequest = null,
  description,
  details = {},
  req = null
}) => {
  try {
    const auditLog = await AuditLog.create({
      action,
      performedBy,
      targetUser,
      targetInventory,
      targetRequest,
      description,
      details,
      ipAddress: req ? req.ip || req.connection.remoteAddress : null,
      userAgent: req ? req.headers['user-agent'] : null
    });
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};
