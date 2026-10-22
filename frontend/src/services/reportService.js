import { api } from '../config/api';

const REPORTS = {
  businessOverview: {
    label: 'Business Overview',
    path: '/reports/business-overview/pdf',
    dataPath: '/reports/business-overview/data',
    fileName: 'TechNova-Business-Overview-Report.pdf',
  },
  earnings: {
    label: 'Earnings Report',
    path: '/reports/earnings/pdf',
    dataPath: '/reports/earnings/data',
    fileName: 'TechNova-Earnings-Report.pdf',
  },
  bookingAnalysis: {
    label: 'Booking Analysis',
    path: '/reports/booking-analysis/pdf',
    dataPath: '/reports/booking-analysis/data',
    fileName: 'TechNova-Booking-Analysis-Report.pdf',
  },
  vehicleAnalysis: {
    label: 'Vehicle Analysis',
    path: '/reports/vehicle-analysis/pdf',
    dataPath: '/reports/vehicle-analysis/data',
    fileName: 'TechNova-Vehicle-Analysis-Report.pdf',
  },
  customerReviewAnalysis: {
    label: 'Customer & Review Analysis',
    path: '/reports/customer-review-analysis/pdf',
    dataPath: '/reports/customer-review-analysis/data',
    fileName: 'TechNova-Customer-Review-Analysis-Report.pdf',
  },
};

export const reportItems = Object.entries(REPORTS).map(([key, value]) => ({ key, ...value }));

export const fetchReportData = async (key) => {
  const report = REPORTS[key];
  if (!report || !report.dataPath) throw new Error('Unknown report selected.');
  const response = await api.get(report.dataPath);
  return response;
};

export const downloadReportPdf = async (key) => {
  const report = REPORTS[key];
  if (!report) throw new Error('Unknown report selected.');

  const { blob, fileName } = await api.getBlob(report.path);
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = report.fileName || fileName || 'download.pdf';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};