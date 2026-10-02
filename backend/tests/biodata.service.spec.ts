import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BiodataService } from '../../backend/src/biodata/biodata.service';
import { Biodata } from '../../backend/src/biodata/biodata.entity';
import { ProfileView } from '../../backend/src/biodata/entities/profile-view.entity';
import { CreateBiodataDto } from '../../backend/src/biodata/dto/create-biodata.dto';
import { UpdateBiodataDto } from '../../backend/src/biodata/dto/update-biodata.dto';
import { BiodataApprovalStatus } from '../../backend/src/biodata/enums/admin-approval-status.enum';

describe('BiodataService', () => {
  let service: BiodataService;
  let repository: Repository<Biodata>;
  let profileViewRepository: Repository<ProfileView>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getCount: jest.fn(),
    })),
  };

  const mockProfileViewRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getCount: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BiodataService,
        {
          provide: getRepositoryToken(Biodata),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(ProfileView),
          useValue: mockProfileViewRepository,
        },
      ],
    }).compile();

    service = module.get<BiodataService>(BiodataService);
    repository = module.get<Repository<Biodata>>(getRepositoryToken(Biodata));
    profileViewRepository = module.get<Repository<ProfileView>>(getRepositoryToken(ProfileView));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new biodata', async () => {
      const createBiodataDto: CreateBiodataDto = {
        religion: 'Islam',
        biodataType: 'Male',
        maritalStatus: 'Single',
        dateOfBirth: '1995-01-01',
        age: 29,
        height: '5.6',
        weight: 70,
        complexion: 'Wheatish',
        profession: 'Engineer',
        bloodGroup: 'A+',
        permanentCountry: 'Bangladesh',
        permanentDivision: 'Dhaka',
        permanentZilla: 'Dhaka',
        permanentUpazilla: 'Dhanmondi',
        permanentArea: 'Test Area',
        presentCountry: 'Bangladesh',
        presentDivision: 'Dhaka',
        presentZilla: 'Dhaka',
        presentUpazilla: 'Dhanmondi',
        presentArea: 'Test Area',
        healthIssues: 'None',
        educationMedium: 'English',
        highestEducation: 'Bachelor',
        instituteName: 'Test University',
        passingYear: 2020,
        result: '3.5',
        economicCondition: 'Good',
        fatherName: 'Test Father',
        fatherProfession: 'Business',
        fatherAlive: 'Yes',
        motherName: 'Test Mother',
        motherProfession: 'Housewife',
        motherAlive: 'Yes',
        brothersCount: 1,
        sistersCount: 1,
        partnerAgeMin: 25,
        partnerAgeMax: 35,
        fullName: 'Test User',
        email: 'test@example.com',
        guardianMobile: '01234567890',
        ownMobile: '01234567891',
      };

      const expectedBiodata = {
        id: 1,
        ...createBiodataDto,
        userId: 1,
        biodataApprovalStatus: BiodataApprovalStatus.IN_PROGRESS,
        biodataVisibilityStatus: 'active',
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(expectedBiodata);
      mockRepository.save.mockResolvedValue(expectedBiodata);

      const result = await service.create({ ...createBiodataDto, userId: 1 });

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createBiodataDto,
        userId: 1,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expectedBiodata);
      expect(result).toEqual(expectedBiodata);
    });
  });

  describe('findByUserId', () => {
    it('should find biodata by user ID', async () => {
      const userId = 1;
      const expectedBiodata = {
        id: 1,
        userId,
        religion: 'Islam',
        biodataType: 'Male',
        biodataApprovalStatus: BiodataApprovalStatus.IN_PROGRESS,
      };

      mockRepository.findOne.mockResolvedValue(expectedBiodata);

      const result = await service.findByUserId(userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
        relations: ['user']
      });
      expect(result).toEqual(expectedBiodata);
    });

    it('should return null if no biodata found', async () => {
      const userId = 999;
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByUserId(userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
        relations: ['user']
      });
      expect(result).toBeNull();
    });
  });

  describe('updateByUserId', () => {
    it('should update existing biodata', async () => {
      const userId = 1;
      const updateDto: UpdateBiodataDto = {
        religion: 'Islam',
        biodataType: 'Male',
        completedSteps: [1, 2],
        biodataApprovalStatus: BiodataApprovalStatus.IN_PROGRESS,
      };

      const existingBiodata = {
        id: 1,
        userId,
        religion: 'Hindu',
        biodataType: 'Female',
        biodataApprovalStatus: 'pending',
      };

      const updatedBiodata = {
        ...existingBiodata,
        ...updateDto,
      };

      mockRepository.findOne.mockResolvedValue(existingBiodata);
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValueOnce(existingBiodata).mockResolvedValueOnce(updatedBiodata);

      const result = await service.updateByUserId(userId, updateDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
        relations: ['user']
      });
      expect(mockRepository.update).toHaveBeenCalledWith(existingBiodata.id, updateDto);
      expect(result).toEqual(updatedBiodata);
    });

    it('should create new biodata if none exists', async () => {
      const userId = 1;
      const updateDto: UpdateBiodataDto = {
        religion: 'Islam',
        biodataType: 'Male',
        completedSteps: [1],
        biodataApprovalStatus: BiodataApprovalStatus.IN_PROGRESS,
      };

      const newBiodata = {
        id: 1,
        userId,
        ...updateDto,
        biodataApprovalStatus: BiodataApprovalStatus.IN_PROGRESS,
        biodataVisibilityStatus: 'active',
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(newBiodata);
      mockRepository.save.mockResolvedValue(newBiodata);

      const result = await service.updateByUserId(userId, updateDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
        relations: ['user']
      });
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...updateDto,
        userId,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(newBiodata);
      expect(result).toEqual(newBiodata);
    });
  });

  describe('searchBiodatas', () => {
    it('should search biodatas with filters', async () => {
      const filters = {
        gender: 'Male',
        maritalStatus: 'Single',
        ageMin: 25,
        ageMax: 35,
        page: 1,
        limit: 10,
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockResolvedValue(0),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.searchBiodatas(filters);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('biodata');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('biodata.user', 'user');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('biodata.id', 'DESC');
      expect(result).toEqual({
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      });
    });
  });

  describe('validateOwnership', () => {
    it('should return true if user owns biodata', async () => {
      const biodataId = 1;
      const userId = 1;
      const biodata = {
        id: biodataId,
        userId,
        religion: 'Islam',
      };

      mockRepository.findOne.mockResolvedValue(biodata);

      const result = await service.validateOwnership(biodataId, userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: biodataId },
        relations: ['user']
      });
      expect(result).toBe(true);
    });

    it('should return false if user does not own biodata', async () => {
      const biodataId = 1;
      const userId = 2;
      const biodata = {
        id: biodataId,
        userId: 1, // Different user
        religion: 'Islam',
      };

      mockRepository.findOne.mockResolvedValue(biodata);

      const result = await service.validateOwnership(biodataId, userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: biodataId },
        relations: ['user']
      });
      expect(result).toBe(false);
    });

    it('should return false if biodata does not exist', async () => {
      const biodataId = 999;
      const userId = 1;

      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.validateOwnership(biodataId, userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: biodataId },
        relations: ['user']
      });
      expect(result).toBe(false);
    });
  });
});
