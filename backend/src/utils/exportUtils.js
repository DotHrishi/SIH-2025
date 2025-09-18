const XLSX = require('xlsx');
const { jsPDF } = require('jspdf');
const nodemailer = require('nodemailer');

// Import jsPDF autotable plugin
require('jspdf-autotable');

/**
 * Convert data to Excel format
 * @param {Array} data - Array of objects to export
 * @param {string} sheetName - Name of the Excel sheet
 * @returns {Buffer} Excel file buffer
 */
const createExcelExport = (data, sheetName = 'Data') => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Auto-size columns
    const columnWidths = [];
    if (data.length > 0) {
      Object.keys(data[0]).forEach((key, index) => {
        const maxLength = Math.max(
          key.length,
          ...data.map(row => String(row[key] || '').length)
        );
        columnWidths[index] = { wch: Math.min(maxLength + 2, 50) };
      });
      worksheet['!cols'] = columnWidths;
    }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  } catch (error) {
    throw new Error(`Excel export failed: ${error.message}`);
  }
};

/**
 * Create PDF report with data table
 * @param {Array} data - Array of objects to export
 * @param {Object} options - PDF options (title, subtitle, etc.)
 * @returns {Buffer} PDF file buffer
 */
const createPDFReport = (data, options = {}) => {
  try {
    const {
      title = 'Data Report',
      subtitle = '',
      orientation = 'landscape',
      pageSize = 'a4'
    } = options;
    
    // Create new PDF document
    const doc = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: pageSize
    });
    
    // Add title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(title, 20, 20);
    
    // Add subtitle if provided
    let yPosition = 30;
    if (subtitle) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(subtitle, 20, yPosition);
      yPosition += 10;
    }
    
    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 15;
    
    if (data.length === 0) {
      doc.text('No data available for the selected criteria.', 20, yPosition);
    } else {
      // Add summary
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Total Records: ${data.length}`, 20, yPosition);
      yPosition += 10;
      
      // Add data in a simple format (first 20 records to avoid overflow)
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      
      const headers = Object.keys(data[0]);
      const displayData = data.slice(0, 20); // Limit to first 20 records
      
      // Add headers
      let xPosition = 20;
      const columnWidth = (doc.internal.pageSize.width - 40) / headers.length;
      
      doc.setFont(undefined, 'bold');
      headers.forEach((header, index) => {
        doc.text(header, xPosition + (index * columnWidth), yPosition);
      });
      yPosition += 8;
      
      // Add data rows
      doc.setFont(undefined, 'normal');
      displayData.forEach((row, rowIndex) => {
        if (yPosition > doc.internal.pageSize.height - 30) {
          doc.addPage();
          yPosition = 20;
        }
        
        headers.forEach((header, colIndex) => {
          const value = String(row[header] || '');
          const truncatedValue = value.length > 15 ? value.substring(0, 12) + '...' : value;
          doc.text(truncatedValue, xPosition + (colIndex * columnWidth), yPosition);
        });
        yPosition += 6;
      });
      
      if (data.length > 20) {
        yPosition += 10;
        doc.setFont(undefined, 'italic');
        doc.text(`... and ${data.length - 20} more records. Download CSV/Excel for complete data.`, 20, yPosition);
      }
    }
    
    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 10
      );
    }
    
    // Return PDF buffer
    return Buffer.from(doc.output('arraybuffer'));
  } catch (error) {
    throw new Error(`PDF export failed: ${error.message}`);
  }
};

/**
 * Create CSV content from data
 * @param {Array} data - Array of objects to export
 * @returns {string} CSV content
 */
const createCSVExport = (data) => {
  try {
    if (data.length === 0) {
      return 'No data available';
    }
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas, quotes, or newlines
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  } catch (error) {
    throw new Error(`CSV export failed: ${error.message}`);
  }
};

/**
 * Send email with attachment
 * @param {Object} emailConfig - Email configuration
 * @param {Buffer} attachment - File attachment buffer
 * @param {string} filename - Attachment filename
 * @param {string} mimeType - MIME type of attachment
 */
const sendEmailWithAttachment = async (emailConfig, attachment, filename, mimeType) => {
  try {
    // Create transporter (configure based on your email service)
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    const {
      to,
      subject = 'Data Export Report',
      text = 'Please find the requested data export attached.',
      html
    } = emailConfig;
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: to,
      subject: subject,
      text: text,
      html: html || `<p>${text}</p>`,
      attachments: [
        {
          filename: filename,
          content: attachment,
          contentType: mimeType
        }
      ]
    });
    
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

/**
 * Generate summary statistics for export
 * @param {Array} data - Data array
 * @param {string} type - Type of data (cases, water-quality)
 * @returns {Object} Summary statistics
 */
const generateSummaryStats = (data, type) => {
  if (data.length === 0) {
    return { totalRecords: 0 };
  }
  
  const stats = {
    totalRecords: data.length,
    exportDate: new Date().toISOString(),
    dataType: type
  };
  
  if (type === 'cases') {
    const severityCounts = data.reduce((acc, item) => {
      const severity = item.Severity || item.severity || 'unknown';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});
    
    const emergencyCount = data.filter(item => 
      (item['Emergency Alert'] === 'Yes') || item.emergencyAlert === true
    ).length;
    
    stats.severityDistribution = severityCounts;
    stats.emergencyAlerts = emergencyCount;
    stats.emergencyPercentage = ((emergencyCount / data.length) * 100).toFixed(2);
  }
  
  if (type === 'water-quality') {
    const statusCounts = data.reduce((acc, item) => {
      const status = item.Status || item.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    stats.statusDistribution = statusCounts;
    
    // Calculate average parameters if available
    const numericFields = ['pH', 'Turbidity', 'Dissolved Oxygen', 'Temperature'];
    numericFields.forEach(field => {
      const values = data
        .map(item => parseFloat(item[field]))
        .filter(val => !isNaN(val));
      
      if (values.length > 0) {
        stats[`avg${field.replace(/\s+/g, '')}`] = (
          values.reduce((sum, val) => sum + val, 0) / values.length
        ).toFixed(2);
      }
    });
  }
  
  return stats;
};

module.exports = {
  createExcelExport,
  createPDFReport,
  createCSVExport,
  sendEmailWithAttachment,
  generateSummaryStats
};