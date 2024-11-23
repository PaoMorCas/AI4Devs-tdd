import request from 'supertest';
import { app } from '../../index';
import { PrismaClient } from '@prisma/client';
import { Candidate } from '../../domain/models/Candidate';
import { Resume } from '../../domain/models/Resume';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Request, Response } from 'express';
import { addCandidateController } from '../../presentation/controllers/candidateController';
import { addCandidate } from '../../application/services/candidateService';

// Mock the entire @prisma/client module
jest.mock('@prisma/client', () => {
    const mockPrismaClient = {
        candidate: {
            create: jest.fn(),
            update: jest.fn(),
            findUnique: jest.fn(),
        },
        education: {
            create: jest.fn(),
        },
        workExperience: {
            create: jest.fn(),
        },
        resume: {
            create: jest.fn(),
        },
        $connect: jest.fn(),
        $disconnect: jest.fn(),
    };

    return {
        PrismaClient: jest.fn(() => mockPrismaClient),
    };
});

// Mock the validator
jest.mock('../../application/validator', () => ({
    validateCandidateData: jest.fn().mockImplementation((data) => {
        if (!data.email.includes('@')) {
            throw new Error('Invalid email');
        }
    }),
    validateCV: jest.fn()
}));

// Mock the candidateService
jest.mock('../../application/services/candidateService', () => ({
    addCandidate: jest.fn().mockImplementation(async (data) => {
        // This will throw if validation fails
        const validator = require('../../application/validator');
        await validator.validateCandidateData(data);
        
        return {
            id: 1,
            ...data
        };
    })
}));

const port = 3000; // Define the port number

let server: any; // Declare a variable to hold the server instance

beforeAll((done) => {
    server = app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
        done(); // Call done to indicate that the server is ready
    });
});

afterAll(async () => {
    await server.close(); // Close the server after tests
});

let mockPrisma: any;

beforeEach(() => {
    // Get a fresh instance of the mock for each test
    mockPrisma = new PrismaClient();
    // Reset all mocks
    jest.clearAllMocks();
});

describe('Candidate Routes', () => {

  
    describe('POST /candidates', () => {
        it('should create a new candidate with basic information', async () => {
            const candidateData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '1234567890',
                address: '123 Main St',
                educations: [],
                workExperiences: [],
            };

            const response = await request(app)
                .post('/candidates')
                .send(candidateData);

            expect(response.status).toBe(201);
            expect(response.body).toEqual({
                id: 1,
                firstName: candidateData.firstName,
                lastName: candidateData.lastName,
                email: candidateData.email,
                phone: candidateData.phone,
                address: candidateData.address,
                educations: [],
                workExperiences: []
            });
        });

        it('should return 400 when email is invalid', async () => {
            const invalidCandidate = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'invalid-email',
                phone: '1234567890',
                address: '123 Main St',
                educations: [],
                workExperiences: [],
            };

            const response = await request(app)
                .post('/candidates')
                .send(invalidCandidate);

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'Invalid email'
            });
        });

        it('should create a candidate with education records', async () => {
            const candidateData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '1234567890',
                address: '123 Main St',
                educations: [{
                    institution: 'University of Test',
                    title: 'Computer Science',
                    startDate: '2020-01-01',
                    endDate: '2024-01-01'
                }],
                workExperiences: []
            };

            const response = await request(app)
                .post('/candidates')
                .send(candidateData);

            expect(response.status).toBe(201);
            expect(response.body).toEqual({
                id: 1,
                firstName: candidateData.firstName,
                lastName: candidateData.lastName,
                email: candidateData.email,
                phone: candidateData.phone,
                address: candidateData.address,
                educations: [{
                    institution: candidateData.educations[0].institution,
                    title: candidateData.educations[0].title,
                    startDate: candidateData.educations[0].startDate,
                    endDate: candidateData.educations[0].endDate
                }],
                workExperiences: []
            });
        });

        it('should create a candidate with work experience records', async () => {
            const candidateData = {
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane.doe@example.com',
                phone: '0987654321',
                address: '456 Main St',
                educations: [],
                workExperiences: [{
                    company: 'Tech Company',
                    position: 'Software Engineer',
                    startDate: '2021-01-01',
                    endDate: '2023-01-01',
                    description: 'Developed various applications.'
                }]
            };

            const response = await request(app)
                .post('/candidates')
                .send(candidateData);

            expect(response.status).toBe(201);
            expect(response.body).toEqual({
                id: 1,
                firstName: candidateData.firstName,
                lastName: candidateData.lastName,
                email: candidateData.email,
                phone: candidateData.phone,
                address: candidateData.address,
                educations: [],
                workExperiences: [{
                    company: candidateData.workExperiences[0].company,
                    position: candidateData.workExperiences[0].position,
                    startDate: candidateData.workExperiences[0].startDate,
                    endDate: candidateData.workExperiences[0].endDate,
                    description: candidateData.workExperiences[0].description
                }]
            });
        });

   
        
    });
});
//aqui
describe('Candidate Service',()=>{
    const addCandidateMock = require('../../application/services/candidateService').addCandidate;
        
    it('should return 400 when required fields are missing', async () => {
        const invalidCandidateData = {
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '1234567890',
            address: '123 Main St',
            educations: [],
            workExperiences: [],
        };

        // Mock the validator to throw an error for missing first name
        const validator = require('../../application/validator');
        validator.validateCandidateData.mockImplementationOnce(() => {
            throw new Error('First name is required');
        });

        const response = await request(app)
            .post('/candidates')
            .send(invalidCandidateData);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: 'First name is required',
        });
    });

    it('should return 400 when email already exists', async () => {
        const candidateData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '1234567890',
            address: '123 Main St',
            educations: [],
            workExperiences: [],
        };

        // Mock the addCandidate function to throw an error for duplicate email
        addCandidateMock.mockImplementationOnce(async () => {
            throw new Error('The email already exists in the database');
        });

        const response = await request(app)
            .post('/candidates')
            .send(candidateData);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: 'The email already exists in the database'
        });
    });

    it('should return 400 when CV data is invalid', async () => {
        const candidateData: Candidate = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '1234567890',
            address: '123 Main St',
            education: [],
            workExperience: [],
            resumes: [{
                id: 1,
                candidateId: 1,
                uploadDate: new Date(),
                filePath: '',
                fileType: 'application/pdf',
                save: jest.fn(),
                create: jest.fn()
            }],
            save: jest.fn()
        };

        // Mock the validateCV function to throw an error for invalid CV data
        const validator = require('../../application/validator');
        validator.validateCV.mockImplementationOnce(() => {
            throw new Error('Invalid CV data: filePath is required');
        });

        // Mock the addCandidate function to ensure it calls validateCV
        addCandidateMock.mockImplementationOnce(async (data: Candidate) => {
            await validator.validateCV(data.resumes);
            return {
                id: 1,
                ...data
            };
        });

        const response = await request(app)
            .post('/candidates')
            .send(candidateData);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: 'Invalid CV data: filePath is required',
        });
    });

    it('should return 400 when work experience is invalid', async () => {
        const candidateData: Candidate = new Candidate({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '1234567890',
            address: '123 Main St',
            education: [],
            workExperience: [
                new WorkExperience({
                    company: '',
                    position: 'Software Engineer',
                    startDate: new Date('2021-01-01'),
                    endDate: new Date('2023-01-01'),
                    description: 'Developed various applications.'
                })
            ],
            resumes: [
                new Resume({
                    id: 1,
                    candidateId: 1,
                    uploadDate: new Date(),
                    filePath: 'path/to/resume.pdf',
                    fileType: 'application/pdf',
                })
            ]
        });

        // Mock the validateWorkExperience function to throw an error for invalid work experience data
        const validator = require('../../application/validator');
        validator.validateWorkExperience = jest.fn().mockImplementationOnce(() => {
            throw new Error('Company name is required');
        });

        // Mock the addCandidate function to ensure it calls validateWorkExperience
        addCandidateMock.mockImplementationOnce(async (data: Candidate) => {
            await validator.validateWorkExperience(data.workExperience);
            return {
                id: 1,
                ...data
            };
        });

        const response = await request(app)
            .post('/candidates')
            .send(candidateData);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: 'Company name is required',
        });
    });


    it('should return 400 when education is invalid', async () => {
        const candidateData: Candidate = new Candidate({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane.doe@example.com',
            phone: '0987654321',
            address: '456 Main St',
            education: [
                { institution: '', title: 'Bachelor of Science', startDate: new Date('2020-01-01'), endDate: new Date('2024-01-01') } // Invalid: institution is required
            ],
            workExperience: [],
            resumes: []
        });

        const validator = require('../../application/validator');
        validator.validateEducation = jest.fn().mockImplementationOnce(() => {
            throw new Error('Institution name is required');
        });

        addCandidateMock.mockImplementationOnce(async (data: Candidate) => {
            await validator.validateEducation(data.education);
            return {
                id: 1,
                ...data
            };
        });

        const response = await request(app)
            .post('/candidates')
            .send(candidateData);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: 'Institution name is required',
        });
    });

    it('should return 400 when resumes are missing', async () => {
        const candidateData: Candidate = new Candidate({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '1234567890',
            address: '123 Main St',
            education: [],
            workExperience: [],
            resumes: [] // Invalid: resumes are required
        });

        addCandidateMock.mockImplementationOnce(async (data: Candidate) => {
            if (data.resumes.length === 0) {
                throw new Error('At least one resume is required');
            }
            return {
                id: 1,
                ...data
            };
        });

        const response = await request(app)
            .post('/candidates')
            .send(candidateData);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: 'At least one resume is required',
        });
    });

    it('should return 400 when multiple validation errors occur', async () => {
        const candidateData: Candidate = new Candidate({
            firstName: 'John',
            lastName: 'Doe',
            email: 'invalid-email', // Invalid email
            phone: '1234567890',
            address: '123 Main St',
            education: [],
            workExperience: [
                new WorkExperience({
                    company: '', // Invalid: company name is required
                    position: 'Software Engineer',
                    startDate: new Date('2021-01-01'),
                    endDate: new Date('2023-01-01'),
                    description: 'Developed various applications.'
                })
            ],
            resumes: []
        });

        const validator = require('../../application/validator');
        validator.validateEmail = jest.fn().mockImplementationOnce(() => {
            throw new Error('Invalid email');
        });
        validator.validateWorkExperience = jest.fn().mockImplementationOnce(() => {
            throw new Error('Company name is required');
        });

        addCandidateMock.mockImplementationOnce(async (data: Candidate) => {
            await validator.validateEmail(data.email);
            await validator.validateWorkExperience(data.workExperience);
            if (data.resumes.length === 0) {
                throw new Error('At least one resume is required');
            }
            return {
                id: 1,
                ...data
            };
        });

        const response = await request(app)
            .post('/candidates')
            .send(candidateData);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: 'Invalid email', // Adjust based on your error handling logic
        });
    });
})

describe('Candidate Model', () => {
    let candidate: Candidate;
    let prisma: PrismaClient;

    beforeEach(() => {
        prisma = new PrismaClient(); // Create a new instance of the mocked PrismaClient
        candidate = new Candidate({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '1234567890',
            address: '123 Main St',
            education: [],
            workExperience: [],
            resumes: []
        });
    });

    it('should save a new candidate successfully', async () => {
        // Mock the create method to return a candidate object
        (prisma.candidate.create as jest.Mock).mockResolvedValue({
            id: 1,
            ...candidate,
        });

        const savedCandidate = await candidate.save();
        expect(savedCandidate).toHaveProperty('id');
        expect(savedCandidate.firstName).toBe(candidate.firstName);
    });

    it('should update an existing candidate successfully', async () => {
        // First, save the candidate to get an ID
        (prisma.candidate.create as jest.Mock).mockResolvedValue({
            id: 1,
            ...candidate,
        });
        await candidate.save(); // Save to get an ID

        candidate.id = 1; // Set the ID for the update
        candidate.firstName = 'Jane';

        // Mock the update method to return the updated candidate
        (prisma.candidate.update as jest.Mock).mockResolvedValue(candidate);

        const updatedCandidate = await candidate.save();
        expect(updatedCandidate.firstName).toBe('Jane');
    });

    it('should throw an error if the candidate cannot be saved', async () => {
        // Mock the create method to throw an error
        (prisma.candidate.create as jest.Mock).mockRejectedValue(new Error('Database error'));

        await expect(candidate.save()).rejects.toThrow('Database error');
    });

    it('should find a candidate by ID', async () => {
        // Mock the create method to return a candidate object
        (prisma.candidate.create as jest.Mock).mockResolvedValue({
            id: 1,
            ...candidate,
        });
        await candidate.save(); // Save to get an ID

        // Mock the findUnique method to return the candidate
        (prisma.candidate.findUnique as jest.Mock).mockResolvedValue({
            id: 1,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email,
            phone: candidate.phone,
            address: candidate.address,
            education: candidate.education,
            workExperience: candidate.workExperience,
            resumes: candidate.resumes,
        });

        const foundCandidate = await Candidate.findOne(1);
        expect(foundCandidate).toBeInstanceOf(Candidate);
        expect(foundCandidate?.id).toBe(1);
    });

    it('should return null if candidate not found', async () => {
        // Mock the findUnique method to return null
        (prisma.candidate.findUnique as jest.Mock).mockResolvedValue(null);

        const foundCandidate = await Candidate.findOne(999); // Assuming 999 does not exist
        expect(foundCandidate).toBeNull();
    });
}); 

describe('Candidate Controller', () => {
    it('should add a candidate successfully', async () => {
        const candidateData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '1234567890',
            address: '123 Main St',
            education: [],
            workExperience: [],
            resumes: []
        };

        (addCandidate as jest.Mock).mockResolvedValue({ id: 1, ...candidateData });

        const req = { body: candidateData } as Partial<Request>;
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

        await addCandidateController(req as Request, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Candidate added successfully',
            data: { id: 1, ...candidateData }
        });
    });

    it('should return an error when adding a candidate fails', async () => {
        const candidateData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'invalid-email', // Invalid email to trigger error
            phone: '1234567890',
            address: '123 Main St',
            education: [],
            workExperience: [],
            resumes: []
        };

        (addCandidate as jest.Mock).mockRejectedValue(new Error('Error adding candidate'));

        const req = { body: candidateData } as Partial<Request>;
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

        await addCandidateController(req as Request, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Error adding candidate',
            error: 'Error adding candidate'
        });
    });

    it('should return an error when the request body is empty', async () => {
        const req = { body: {} } as Partial<Request>;
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

        await addCandidateController(req as Request, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
           "error": "Error adding candidate",
      "message": "Error adding candidate",
        });
    });
}); 