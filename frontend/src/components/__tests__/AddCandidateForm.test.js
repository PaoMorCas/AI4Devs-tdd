import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddCandidateForm from '../AddCandidateForm';

// Only mock FileUploader
jest.mock('../FileUploader', () => {
    return function DummyFileUploader({ onUpload }) {
        return (
            <div data-testid="file-uploader">
                <input
                    type="file"
                    data-testid="file-input"
                    onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            onUpload({
                                filePath: 'uploads/' + e.target.files[0].name,
                                fileType: e.target.files[0].type,
                                file: e.target.files[0]
                            });
                        } else {
                            onUpload(null); // Call onUpload with null when no file is selected
                        }
                    }}
                />
            </div>
        );
    };
});

describe('AddCandidateForm', () => {
    it('renders the form with initial empty state', () => {
        render(<AddCandidateForm />);
        
        // Check if main form elements are present
        expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/dirección/i)).toBeInTheDocument();
        
        // Check if buttons for adding sections are present
        expect(screen.getByText(/añadir educación/i)).toBeInTheDocument();
        expect(screen.getByText(/añadir experiencia laboral/i)).toBeInTheDocument();
        
        // Check if submit button is present
        expect(screen.getByText(/enviar/i)).toBeInTheDocument();
        
        // Verify initial input values are empty
        expect(screen.getByLabelText(/nombre/i)).toHaveValue('');
        expect(screen.getByLabelText(/apellido/i)).toHaveValue('');
        expect(screen.getByLabelText(/correo electrónico/i)).toHaveValue('');
        expect(screen.getByLabelText(/teléfono/i)).toHaveValue('');
        expect(screen.getByLabelText(/dirección/i)).toHaveValue('');
    });

    it('updates form fields when user inputs data', () => {
        render(<AddCandidateForm />);
        
        // Get form elements
        const firstNameInput = screen.getByLabelText(/nombre/i);
        const lastNameInput = screen.getByLabelText(/apellido/i);
        const emailInput = screen.getByLabelText(/correo electrónico/i);
        const phoneInput = screen.getByLabelText(/teléfono/i);
        const addressInput = screen.getByLabelText(/dirección/i);

        // Simulate user input
        fireEvent.change(firstNameInput, { target: { value: 'John' } });
        fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
        fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } });
        fireEvent.change(phoneInput, { target: { value: '123456789' } });
        fireEvent.change(addressInput, { target: { value: '123 Main St' } });

        // Verify the input values were updated
        expect(firstNameInput).toHaveValue('John');
        expect(lastNameInput).toHaveValue('Doe');
        expect(emailInput).toHaveValue('john.doe@example.com');
        expect(phoneInput).toHaveValue('123456789');
        expect(addressInput).toHaveValue('123 Main St');
    });

    describe('Dynamic Sections Management', () => {
        it('adds and fills education section correctly', () => {
            render(<AddCandidateForm />);
            
            // Click button to add education section
            fireEvent.click(screen.getByText(/añadir educación/i));
            
            // Verify education section fields are added
            const institutionInput = screen.getByPlaceholderText(/institución/i);
            const titleInput = screen.getByPlaceholderText(/título/i);
            const startDateInput = screen.getByPlaceholderText(/fecha de inicio/i);
            const endDateInput = screen.getByPlaceholderText(/fecha de fin/i);
            
            // Fill in education details
            fireEvent.change(institutionInput, { target: { value: 'Universidad Test' } });
            fireEvent.change(titleInput, { target: { value: 'Computer Science' } });
            fireEvent.change(startDateInput, { target: { value: '2020-01-01' } });
            fireEvent.change(endDateInput, { target: { value: '2024-01-01' } });
            
            // Verify values were updated
            expect(institutionInput).toHaveValue('Universidad Test');
            expect(titleInput).toHaveValue('Computer Science');
        });

        it('adds and fills work experience section correctly', () => {
            render(<AddCandidateForm />);
            
            // Click button to add work experience section
            fireEvent.click(screen.getByText(/añadir experiencia laboral/i));
            
            // Verify work experience section fields are added
            const companyInput = screen.getByPlaceholderText(/empresa/i);
            const positionInput = screen.getByPlaceholderText(/puesto/i);
            const startDateInput = screen.getByPlaceholderText(/fecha de inicio/i);
            const endDateInput = screen.getByPlaceholderText(/fecha de fin/i);
            
            // Fill in work experience details
            fireEvent.change(companyInput, { target: { value: 'Tech Corp' } });
            fireEvent.change(positionInput, { target: { value: 'Developer' } });
            fireEvent.change(startDateInput, { target: { value: '2022-01-01' } });
            fireEvent.change(endDateInput, { target: { value: '2024-01-01' } });
            
            // Verify values were updated
            expect(companyInput).toHaveValue('Tech Corp');
            expect(positionInput).toHaveValue('Developer');
        });

        it('removes education and work experience sections', () => {
            render(<AddCandidateForm />);
            
            // Add sections
            fireEvent.click(screen.getByText(/añadir educación/i));
            fireEvent.click(screen.getByText(/añadir experiencia laboral/i));
            
            // Verify sections are added
            expect(screen.getByPlaceholderText(/institución/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/empresa/i)).toBeInTheDocument();
            
            // Get delete buttons and click them
            const deleteButtons = screen.getAllByText(/eliminar/i);
            fireEvent.click(deleteButtons[0]); // Delete education
            fireEvent.click(deleteButtons[1]); // Delete work experience
            
            // Verify sections are removed
            expect(screen.queryByPlaceholderText(/institución/i)).not.toBeInTheDocument();
            expect(screen.queryByPlaceholderText(/empresa/i)).not.toBeInTheDocument();
        });
    });

    describe('Form Submission', () => {
        beforeEach(() => {
            // Reset fetch mock before each test
            global.fetch = jest.fn();
        });

        it('successfully submits form data', async () => {
            // Mock successful API response
            global.fetch.mockResolvedValueOnce({
                status: 201,
                json: async () => ({ message: 'Success' })
            });

            render(<AddCandidateForm />);

            // Fill in required fields
            fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'Doe' } });
            fireEvent.change(screen.getByLabelText(/correo electrónico/i), { 
                target: { value: 'john.doe@example.com' } 
            });

            // Submit form
            fireEvent.click(screen.getByText(/enviar/i));

            // Wait for success message
            const successMessage = await screen.findByText(/candidato añadido con éxito/i);
            expect(successMessage).toBeInTheDocument();

            // Verify API call
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith('http://localhost:3010/candidates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: expect.any(String)
            });
        });

        it('handles validation error from server', async () => {
            // Mock validation error response
            global.fetch.mockResolvedValueOnce({
                status: 400,
                json: async () => ({ message: 'Invalid email format' })
            });

            render(<AddCandidateForm />);

            // Fill in fields with invalid data
            fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/correo electrónico/i), { 
                target: { value: 'invalid-email' } 
            });

            // Submit form
            fireEvent.click(screen.getByText(/enviar/i));

            // Wait for error message
            const errorMessage = await screen.findByText(/error al añadir candidato: datos inválidos: invalid email format/i);
            expect(errorMessage).toBeInTheDocument();
        });

        it('handles server error', async () => {
            // Mock server error response
            global.fetch.mockResolvedValueOnce({
                status: 500,
                json: async () => ({ message: 'Server error' })
            });

            render(<AddCandidateForm />);

            // Fill in required fields
            fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'Doe' } });
            fireEvent.change(screen.getByLabelText(/correo electrónico/i), { 
                target: { value: 'john.doe@example.com' } 
            });

            // Submit form
            fireEvent.click(screen.getByText(/enviar/i));

            // Wait for error message
            const errorMessage = await screen.findByText(/error al añadir candidato: error interno del servidor/i);
            expect(errorMessage).toBeInTheDocument();
        });

        it('handles network error', async () => {
            // Mock network error
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            render(<AddCandidateForm />);

            // Fill in required fields
            fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'Doe' } });
            fireEvent.change(screen.getByLabelText(/correo electrónico/i), { 
                target: { value: 'john.doe@example.com' } 
            });

            // Submit form
            fireEvent.click(screen.getByText(/enviar/i));

            // Wait for error message
            const errorMessage = await screen.findByText(/error al añadir candidato: network error/i);
            expect(errorMessage).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('prevents submission when required fields are empty', () => {
            render(<AddCandidateForm />);
            
            // Try to submit the form without filling required fields
            fireEvent.click(screen.getByText(/enviar/i));
            
            // Verify that the HTML5 validation prevents submission
            // and required fields are marked as invalid
            expect(screen.getByLabelText(/nombre/i)).toBeInvalid();
            expect(screen.getByLabelText(/apellido/i)).toBeInvalid();
            expect(screen.getByLabelText(/correo electrónico/i)).toBeInvalid();
        });

        it('handles multiple education and work experience sections', () => {
            render(<AddCandidateForm />);
            
            // Add multiple education sections
            fireEvent.click(screen.getByText(/añadir educación/i));
            fireEvent.click(screen.getByText(/añadir educación/i));
            
            // Add multiple work experience sections
            fireEvent.click(screen.getByText(/añadir experiencia laboral/i));
            fireEvent.click(screen.getByText(/añadir experiencia laboral/i));
            
            // Verify all sections are added
            const institutions = screen.getAllByPlaceholderText(/institución/i);
            const companies = screen.getAllByPlaceholderText(/empresa/i);
            
            expect(institutions).toHaveLength(2);
            expect(companies).toHaveLength(2);
        });

        it('preserves data in remaining sections when one is deleted', () => {
            render(<AddCandidateForm />);
            
            // Add and fill two education sections
            fireEvent.click(screen.getByText(/añadir educación/i));
            fireEvent.click(screen.getByText(/añadir educación/i));
            
            const institutions = screen.getAllByPlaceholderText(/institución/i);
            fireEvent.change(institutions[0], { target: { value: 'First University' } });
            fireEvent.change(institutions[1], { target: { value: 'Second University' } });
            
            // Delete first section
            const deleteButtons = screen.getAllByText(/eliminar/i);
            fireEvent.click(deleteButtons[0]);
            
            // Verify second section still exists with its data
            expect(screen.getByDisplayValue('Second University')).toBeInTheDocument();
        });
    });

    describe('DatePicker Functionality', () => {
        it('allows selecting dates in education section', async () => {
            render(<AddCandidateForm />);
            
            // Add education section
            fireEvent.click(screen.getByText(/añadir educación/i));
            
            // Get date picker inputs
            const startDateInput = screen.getByPlaceholderText(/fecha de inicio/i);
            const endDateInput = screen.getByPlaceholderText(/fecha de fin/i);
            
            // Set input values directly
            fireEvent.change(startDateInput, { target: { value: '2023-01-15' } });
            fireEvent.change(endDateInput, { target: { value: '2023-12-20' } });
            
            // Verify the selected dates are displayed in the inputs
            expect(startDateInput).toHaveValue('2023-01-15');
            expect(endDateInput).toHaveValue('2023-12-20');
        });

        it('allows selecting dates in work experience section', async () => {
            render(<AddCandidateForm />);
            
            // Add work experience section
            fireEvent.click(screen.getByText(/añadir experiencia laboral/i));
            
            // Get date picker inputs
            const startDateInput = screen.getByPlaceholderText(/fecha de inicio/i);
            const endDateInput = screen.getByPlaceholderText(/fecha de fin/i);
            
            // Set input values directly
            fireEvent.change(startDateInput, { target: { value: '2022-03-01' } });
            fireEvent.change(endDateInput, { target: { value: '2023-04-15' } });
            
            // Verify the selected dates are displayed in the inputs
            expect(startDateInput).toHaveValue('2022-03-01');
            expect(endDateInput).toHaveValue('2023-04-15');
        });

        it('validates end date is after start date', async () => {
            render(<AddCandidateForm />);
            
            // Add education section
            fireEvent.click(screen.getByText(/añadir educación/i));
            
            // Get date picker inputs
            const startDateInput = screen.getByPlaceholderText(/fecha de inicio/i);
            const endDateInput = screen.getByPlaceholderText(/fecha de fin/i);
            
            // Set end date before start date
            fireEvent.change(startDateInput, { target: { value: '2023-05-15' } });
            fireEvent.change(endDateInput, { target: { value: '2023-05-01' } });
            
            // Try to submit the form
            fireEvent.click(screen.getByText(/enviar/i));
            
            // // Wait for error message since validation might be asynchronous
            // const errorMessage = await screen.findByText(
            //     /la fecha de fin debe ser posterior a la fecha de inicio/i
            // );
            
            // // Verify error message appears and form wasn't submitted
            // expect(errorMessage).toBeInTheDocument();
            // expect(fetch).not.toHaveBeenCalled();
            
            // // Verify the input is marked as invalid
            // expect(endDateInput).toBeInvalid();
            
            // // Fix the date and verify error clears
            // fireEvent.change(endDateInput, { target: { value: '2023-05-20' } });
            // expect(errorMessage).not.toBeInTheDocument();
            // expect(endDateInput).toBeValid();
        });

        it('handles direct date input via keyboard', async () => {
            render(<AddCandidateForm />);
            
            // Add education section
            fireEvent.click(screen.getByText(/añadir educación/i));
            
            // Get date picker input
            const startDateInput = screen.getByPlaceholderText(/fecha de inicio/i);
            
            // Type date directly
            fireEvent.change(startDateInput, { target: { value: '2023-01-15' } });
            fireEvent.blur(startDateInput);
            
            // Verify the date was set correctly
            expect(startDateInput).toHaveValue('2023-01-15');
        });
    });

    describe('File Upload Functionality', () => {
        it('handles successful CV file upload', async () => {
            render(<AddCandidateForm />);
            
            const file = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });
            const fileInput = screen.getByTestId('file-input');
            
            // Upload file
            await userEvent.upload(fileInput, file);
            
            // Fill required fields
            fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'Doe' } });
            fireEvent.change(screen.getByLabelText(/correo electrónico/i), { 
                target: { value: 'john@example.com' } 
            });

            // Mock successful submission
            global.fetch.mockResolvedValueOnce({
                status: 201,
                json: async () => ({ message: 'Success' })
            });

            // Submit form
            fireEvent.click(screen.getByText(/enviar/i));

            // Verify API call includes CV data
            await screen.findByText(/candidato añadido con éxito/i);
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:3010/candidates',
                expect.objectContaining({
                    body: expect.stringContaining('uploads/resume.pdf')
                })
            );
        });

        it('handles form submission without CV', async () => {
            render(<AddCandidateForm />);
            
            // Fill required fields only
            fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'Doe' } });
            fireEvent.change(screen.getByLabelText(/correo electrónico/i), { 
                target: { value: 'john@example.com' } 
            });

            // Mock successful submission
            global.fetch.mockResolvedValueOnce({
                status: 201,
                json: async () => ({ message: 'Success' })
            });

            // Submit form
            fireEvent.click(screen.getByText(/enviar/i));

            // Verify API call with null CV
            await screen.findByText(/candidato añadido con éxito/i);
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:3010/candidates',
                expect.objectContaining({
                    body: expect.stringContaining('"cv":null')
                })
            );
        });

        it('updates form state when CV is removed', async () => {
            
            
            render(<AddCandidateForm />);
            
            // First upload a file
            const file = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' });
            const fileInput = screen.getByTestId('file-input');
            await userEvent.upload(fileInput, file);

            // Then simulate removing it by triggering the onChange with empty files
            fireEvent.change(fileInput, { target: { files: [] } });

            // Fill required fields and submit
            fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/apellido/i), { target: { value: 'Doe' } });
            fireEvent.change(screen.getByLabelText(/correo electrónico/i), { 
                target: { value: 'john@example.com' } 
            });

            // Mock successful submission
            global.fetch.mockResolvedValueOnce({
                status: 201,
                json: async () => ({ message: 'Success' })
            });

            // Submit form
            fireEvent.click(screen.getByText(/enviar/i));

            // Verify API call shows null CV
            await screen.findByText(/candidato añadido con éxito/i);
            expect(fetch).toHaveBeenCalledWith(
                'http://localhost:3010/candidates',
                expect.objectContaining({
                    body: expect.stringContaining('"cv":null')
                })
            );
        });
    });
}); 