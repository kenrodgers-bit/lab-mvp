const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Inventory = require('../models/Inventory');
const Request = require('../models/Request');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLog');

// @route   GET /api/reports/inventory/pdf
// @desc    Generate inventory report (PDF)
// @access  Private/Admin
router.get('/inventory/pdf', protect, authorize('admin'), async (req, res) => {
  try {
    const inventory = await Inventory.find({ isActive: true })
      .populate('addedBy', 'name')
      .sort('department name');

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.pdf');
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Lab Inventory Report', { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Summary
    doc.fontSize(12).text(`Total Items: ${inventory.length}`);
    const lowStock = inventory.filter(item => item.quantity <= item.minStockLevel);
    doc.text(`Low Stock Items: ${lowStock.length}`);
    doc.moveDown();

    // Table
    doc.fontSize(10);
    let y = doc.y;
    
    inventory.forEach((item, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      const stockStatus = item.quantity <= item.minStockLevel ? ' [LOW STOCK]' : '';
      doc.text(`${index + 1}. ${item.name}${stockStatus}`, 50, y);
      doc.text(`   Department: ${item.department} | Qty: ${item.quantity} ${item.unit} | Min: ${item.minStockLevel}`, 50, y + 15);
      y += 35;
      doc.y = y;
    });

    doc.end();

    // Create audit log
    await createAuditLog({
      action: 'REPORT_GENERATED',
      performedBy: req.user._id,
      description: `Admin ${req.user.name} generated inventory PDF report`,
      req
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/reports/inventory/excel
// @desc    Generate inventory report (Excel)
// @access  Private/Admin
router.get('/inventory/excel', protect, authorize('admin'), async (req, res) => {
  try {
    const inventory = await Inventory.find({ isActive: true })
      .populate('addedBy', 'name')
      .sort('department name');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory');

    // Define columns
    worksheet.columns = [
      { header: 'Item Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Min Stock Level', key: 'minStockLevel', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Supplier', key: 'supplier', width: 20 },
      { header: 'Cost Per Unit', key: 'costPerUnit', width: 12 },
      { header: 'Added By', key: 'addedBy', width: 20 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Add data
    inventory.forEach(item => {
      const status = item.quantity <= item.minStockLevel ? 'LOW STOCK' : 'OK';
      worksheet.addRow({
        name: item.name,
        category: item.category,
        department: item.department,
        quantity: item.quantity,
        unit: item.unit,
        minStockLevel: item.minStockLevel,
        status,
        location: item.location,
        supplier: item.supplier,
        costPerUnit: item.costPerUnit,
        addedBy: item.addedBy?.name || 'N/A'
      });
    });

    // Add conditional formatting for low stock
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && row.getCell('status').value === 'LOW STOCK') {
        row.getCell('status').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF0000' }
        };
        row.getCell('status').font = { color: { argb: 'FFFFFFFF' } };
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.xlsx');

    await workbook.xlsx.write(res);
    res.end();

    // Create audit log
    await createAuditLog({
      action: 'REPORT_GENERATED',
      performedBy: req.user._id,
      description: `Admin ${req.user.name} generated inventory Excel report`,
      req
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/reports/requests/excel
// @desc    Generate requests report (Excel)
// @access  Private/Admin
router.get('/requests/excel', protect, authorize('admin'), async (req, res) => {
  try {
    const requests = await Request.find()
      .populate('requestedBy', 'name department')
      .populate('reviewedBy', 'name')
      .sort('-createdAt');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Requests');

    worksheet.columns = [
      { header: 'Request Number', key: 'requestNumber', width: 20 },
      { header: 'Requested By', key: 'requestedBy', width: 25 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Priority', key: 'priority', width: 10 },
      { header: 'Items Count', key: 'itemsCount', width: 12 },
      { header: 'Reviewed By', key: 'reviewedBy', width: 25 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Reviewed At', key: 'reviewedAt', width: 20 }
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    requests.forEach(request => {
      worksheet.addRow({
        requestNumber: request.requestNumber,
        requestedBy: request.requestedBy?.name || 'N/A',
        department: request.department,
        status: request.status.toUpperCase(),
        priority: request.priority.toUpperCase(),
        itemsCount: request.items.length,
        reviewedBy: request.reviewedBy?.name || 'Pending',
        createdAt: new Date(request.createdAt).toLocaleDateString(),
        reviewedAt: request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : 'N/A'
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=requests-report.xlsx');

    await workbook.xlsx.write(res);
    res.end();

    await createAuditLog({
      action: 'REPORT_GENERATED',
      performedBy: req.user._id,
      description: `Admin ${req.user.name} generated requests Excel report`,
      req
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/reports/audit/excel
// @desc    Generate audit log report (Excel)
// @access  Private/Admin
router.get('/audit/excel', protect, authorize('admin'), async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('performedBy', 'name email')
      .sort('-createdAt')
      .limit(1000);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Audit Logs');

    worksheet.columns = [
      { header: 'Date & Time', key: 'createdAt', width: 20 },
      { header: 'Action', key: 'action', width: 30 },
      { header: 'Performed By', key: 'performedBy', width: 25 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'IP Address', key: 'ipAddress', width: 15 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    logs.forEach(log => {
      worksheet.addRow({
        createdAt: new Date(log.createdAt).toLocaleString(),
        action: log.action.replace(/_/g, ' '),
        performedBy: log.performedBy?.name || 'System',
        description: log.description,
        ipAddress: log.ipAddress || 'N/A'
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-log-report.xlsx');

    await workbook.xlsx.write(res);
    res.end();

    await createAuditLog({
      action: 'REPORT_GENERATED',
      performedBy: req.user._id,
      description: `Admin ${req.user.name} generated audit log Excel report`,
      req
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
