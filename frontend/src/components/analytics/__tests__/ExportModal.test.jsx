import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ExportModal from '../ExportModal';
import { analyticsAPI } from '../../../services/api';

// Mock the API
vi.mock('../../../services/api', () => ({
  analyticsAPI: {
    exportCSV: vi.fn(),
    exportExcel: vi.fn(),
    exportPDF: vi.fn(),
    emailReport: vi.fn()
  }
}));

describe('ExportModal', () => {
  const mockFilters = {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    district: 'Test District',
    severity: 'moderate'
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders export modal when open', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        filters={mockFilters}
      />
    );

    expect(screen.getByText('Export Data')).toBeInTheDocument();
    expect(screen.getByText('Patient Cases')).toBeInTheDocument();
    expect(screen.getByText('Water Quality Reports')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ExportModal
        isOpen={false}
        onClose={mockOnClose}
        filters={mockFilters}
      />
    );

    expect(screen.queryByText('Export Data')).not.toBeInTheDocument();
  });

  it('shows applied filters summary', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        filters={mockFilters}
      />
    );

    expect(screen.getByText('Applied Filters:')).toBeInTheDocument();
    expect(screen.getByText('Start Date: 2024-01-01')).toBeInTheDocument();
    expect(screen.getByText('End Date: 2024-01-31')).toBeInTheDocument();
    expect(screen.getByText('District: Test District')).toBeInTheDocument();
    expect(screen.getByText('Severity: moderate')).toBeInTheDocument();
  });

  it('handles direct download export', async () => {
    const mockBlob = new Blob(['test data'], { type: 'text/csv' });
    analyticsAPI.exportCSV.mockResolvedValue({ data: mockBlob });

    // Mock URL.createObjectURL and related functions
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock document.createElement and appendChild
    const mockLink = {
      href: '',
      setAttribute: vi.fn(),
      click: vi.fn(),
      remove: vi.fn()
    };
    document.createElement = vi.fn(() => mockLink);
    document.body.appendChild = vi.fn();

    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        filters={mockFilters}
      />
    );

    // Select CSV format
    const csvOption = screen.getByDisplayValue('csv');
    fireEvent.click(csvOption);

    // Click export button
    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(analyticsAPI.exportCSV).toHaveBeenCalledWith({
        type: 'cases',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        district: 'Test District',
        severity: 'moderate'
      });
    });

    expect(mockLink.click).toHaveBeenCalled();
  });

  it('handles email export', async () => {
    analyticsAPI.emailReport.mockResolvedValue({
      data: {
        message: 'Report sent successfully',
        recipient: 'test@example.com'
      }
    });

    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        filters={mockFilters}
      />
    );

    // Enter email
    const emailInput = screen.getByPlaceholderText('recipient@example.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Enter subject
    const subjectInput = screen.getByPlaceholderText('Water Health Surveillance Report');
    fireEvent.change(subjectInput, { target: { value: 'Test Report' } });

    // Click send email button
    const sendButton = screen.getByText('Send Email');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(analyticsAPI.emailReport).toHaveBeenCalledWith({
        type: 'cases',
        format: 'pdf',
        email: 'test@example.com',
        subject: 'Test Report',
        message: '',
        includeCharts: false,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        district: 'Test District',
        severity: 'moderate'
      });
    });
  });

  it('shows success message after successful export', async () => {
    analyticsAPI.emailReport.mockResolvedValue({
      data: {
        message: 'Report sent successfully',
        recipient: 'test@example.com'
      }
    });

    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        filters={mockFilters}
      />
    );

    // Enter email and submit
    const emailInput = screen.getByPlaceholderText('recipient@example.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const sendButton = screen.getByText('Send Email');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Report sent successfully to test@example.com')).toBeInTheDocument();
    });
  });

  it('shows error message on export failure', async () => {
    analyticsAPI.exportCSV.mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Export failed'
          }
        }
      }
    });

    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        filters={mockFilters}
      />
    );

    // Select CSV and export
    const csvOption = screen.getByDisplayValue('csv');
    fireEvent.click(csvOption);

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('Export failed')).toBeInTheDocument();
    });
  });

  it('closes modal when cancel is clicked', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        filters={mockFilters}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows email fields only when email is provided', () => {
    render(
      <ExportModal
        isOpen={true}
        onClose={mockOnClose}
        filters={mockFilters}
      />
    );

    // Initially, subject and message fields should not be visible
    expect(screen.queryByPlaceholderText('Water Health Surveillance Report')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Please find the requested analytics report attached.')).not.toBeInTheDocument();

    // Enter email
    const emailInput = screen.getByPlaceholderText('recipient@example.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Now subject and message fields should be visible
    expect(screen.getByPlaceholderText('Water Health Surveillance Report')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Please find the requested analytics report attached.')).toBeInTheDocument();
  });
});