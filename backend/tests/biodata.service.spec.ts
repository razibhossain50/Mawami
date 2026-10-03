import { jest } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BiodataService } from '../src/biodata/biodata.service';
import { Biodata } from '../src/biodata/biodata.entity';
import { ProfileView } from '../src/biodata/entities/profile-view.entity';
import { BiodataApprovalStatus } from '../src/biodata/enums/admin-approval-status.enum';
import { BiodataVisibilityStatus } from '../src/biodata/enums/user-visibility-status.enum';

const makeBiodata = (overrides: Partial<Biodata> = {}) =>
  Object.assign(new Biodata(), {
    id: 1,
    userId: 1,
    fullName: 'Test User',
    biodataApprovalStatus: BiodataApprovalStatus.APPROVED,
    biodataVisibilityStatus: BiodataVisibilityStatus.ACTIVE,
    viewCount: 0,
    ...overrides,
  });

const makeQueryBuilder = (result: [Biodata[], number] = [[], 0]) => {
  const qb: any = {};
  for (const method of ['where', 'andWhere', 'orderBy', 'skip', 'take', 'leftJoinAndSelect']) {
    qb[method] = jest.fn(() => qb);
  }
  qb.getManyAndCount = jest.fn(async () => result);
  qb.getOne = jest.fn(async () => null);
  qb.getCount = jest.fn(async () => 0);
  return qb;
};

describe('BiodataService', () => {
  let service: BiodataService;
  const repo = {
    create: jest.fn((data: any) => data),
    save: jest.fn(async (data: any) => ({ id: 1, ...data })),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(async () => ({ affected: 1 })),
    delete: jest.fn(async () => ({ affected: 1 })),
    increment: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const viewRepo = {
    create: jest.fn((data: any) => data),
    save: jest.fn(async (data: any) => data),
    createQueryBuilder: jest.fn(() => makeQueryBuilder()),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BiodataService,
        { provide: getRepositoryToken(Biodata), useValue: repo },
        { provide: getRepositoryToken(ProfileView), useValue: viewRepo },
      ],
    }).compile();
    service = module.get(BiodataService);
  });

  describe('create', () => {
    it('creates a biodata for a user without one', async () => {
      repo.findOne.mockResolvedValueOnce(null as never);
      const result = await service.create({ fullName: 'A', userId: 7 });
      expect(repo.create).toHaveBeenCalledWith({ fullName: 'A', userId: 7 });
      expect(result).toMatchObject({ fullName: 'A', userId: 7 });
    });

    it('rejects a second biodata for the same user', async () => {
      repo.findOne.mockResolvedValueOnce(makeBiodata() as never);
      await expect(service.create({ userId: 1 } as any)).rejects.toBeInstanceOf(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('public reads', () => {
    it('findAll only queries approved + active biodatas, without the user relation', async () => {
      repo.find.mockResolvedValueOnce([] as never);
      await service.findAll();
      const options = repo.find.mock.calls[0][0] as any;
      expect(options.where).toEqual({
        biodataApprovalStatus: BiodataApprovalStatus.APPROVED,
        biodataVisibilityStatus: BiodataVisibilityStatus.ACTIVE,
      });
      expect(options.relations).toBeUndefined();
    });

    it.each([
      [BiodataApprovalStatus.PENDING, BiodataVisibilityStatus.ACTIVE],
      [BiodataApprovalStatus.APPROVED, BiodataVisibilityStatus.INACTIVE],
    ])('findOne hides a biodata that is %s / %s', async (approval, visibility) => {
      repo.findOne.mockResolvedValueOnce(
        makeBiodata({ biodataApprovalStatus: approval, biodataVisibilityStatus: visibility }) as never,
      );
      expect(await service.findOne(1)).toBeNull();
    });

    it('findOne returns an approved + active biodata', async () => {
      const biodata = makeBiodata();
      repo.findOne.mockResolvedValueOnce(biodata as never);
      expect(await service.findOne(1)).toBe(biodata);
    });
  });

  describe('updateByUserId', () => {
    it('updates the existing biodata, keeping clearable nulls and dropping others', async () => {
      const existing = makeBiodata({ id: 5 });
      repo.findOne.mockResolvedValueOnce(existing as never).mockResolvedValueOnce(existing as never);
      await service.updateByUserId(1, { fullName: 'New', profilePicture: null, religion: null, age: undefined } as any);
      expect(repo.update).toHaveBeenCalledWith(5, { fullName: 'New', profilePicture: null });
    });

    it('creates the biodata when the user has none', async () => {
      repo.findOne.mockResolvedValueOnce(null as never);
      await service.updateByUserId(3, { fullName: 'Fresh' });
      expect(repo.create).toHaveBeenCalledWith({ fullName: 'Fresh', userId: 3 });
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('searchBiodatas', () => {
    it('filters by status in SQL and paginates in the database', async () => {
      const qb = makeQueryBuilder([[makeBiodata()], 11]);
      repo.createQueryBuilder.mockReturnValueOnce(qb as never);

      const result = await service.searchBiodatas({ gender: 'Male', biodataNumber: 1, page: 2, limit: 5 });

      expect(qb.where).toHaveBeenCalledWith('biodata.biodataApprovalStatus = :approved', { approved: BiodataApprovalStatus.APPROVED });
      expect(qb.andWhere).toHaveBeenCalledWith('biodata.biodataVisibilityStatus = :active', { active: BiodataVisibilityStatus.ACTIVE });
      expect(qb.andWhere).toHaveBeenCalledWith('biodata.biodataType = :gender', { gender: 'Male' });
      expect(qb.andWhere).toHaveBeenCalledWith('biodata.id = :id', { id: 1 });
      expect(qb.leftJoinAndSelect).not.toHaveBeenCalled();
      expect(qb.skip).toHaveBeenCalledWith(5);
      expect(qb.take).toHaveBeenCalledWith(5);
      expect(result.pagination).toEqual({ page: 2, limit: 5, total: 11, totalPages: 3 });
    });
  });

  describe('validateOwnership', () => {
    it.each([
      [makeBiodata({ userId: 1 }), true],
      [makeBiodata({ userId: 2 }), false],
      [null, false],
    ])('returns %# correctly', async (biodata, expected) => {
      repo.findOne.mockResolvedValueOnce(biodata as never);
      expect(await service.validateOwnership(1, 1)).toBe(expected);
    });
  });

  describe('not-found handling', () => {
    it('updateApprovalStatus throws for an unknown id', async () => {
      repo.update.mockResolvedValueOnce({ affected: 0 });
      await expect(service.updateApprovalStatus(99, BiodataApprovalStatus.APPROVED)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('trackProfileView throws for an unknown id', async () => {
      repo.findOne.mockResolvedValueOnce(null as never);
      await expect(service.trackProfileView(99, undefined, '1.2.3.4')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateStep', () => {
    it('returns the biodata even when it is not public yet', async () => {
      const draft = makeBiodata({ biodataApprovalStatus: BiodataApprovalStatus.IN_PROGRESS });
      repo.findOne.mockResolvedValueOnce(draft as never);
      expect(await service.updateStep(1, 2, { fullName: 'X' } as any)).toBe(draft);
      expect(repo.update).toHaveBeenCalledWith(1, { fullName: 'X', step: 2 });
    });
  });
});
