import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Biodata } from './biodata.entity';
import { ProfileView } from './entities/profile-view.entity';
import { CreateBiodataDto } from './dto/create-biodata.dto';
import { UpdateBiodataDto } from './dto/update-biodata.dto';
import { BiodataApprovalStatus } from './enums/admin-approval-status.enum';
import { BiodataVisibilityStatus } from './enums/user-visibility-status.enum';

// Fields a client may explicitly clear by sending null
const NULLABLE_FIELDS = new Set(['profilePicture', 'email', 'guardianMobile', 'ownMobile']);

// Drop undefined values, and nulls except for fields that may be cleared
function toUpdateData(dto: UpdateBiodataDto): Partial<Biodata> {
  return Object.fromEntries(
    Object.entries(dto).filter(([key, value]) =>
      value !== undefined && (value !== null || NULLABLE_FIELDS.has(key)),
    ),
  );
}

@Injectable()
export class BiodataService {
  constructor(
    @InjectRepository(Biodata)
    private biodataRepository: Repository<Biodata>,
    @InjectRepository(ProfileView)
    private profileViewRepository: Repository<ProfileView>
  ) { }

  async create(createBiodataDto: CreateBiodataDto & { userId: number }) {
    // One biodata per user (findByUserId and PUT /current assume this)
    if (await this.findByUserId(createBiodataDto.userId)) {
      throw new ConflictException('You already have a biodata; update it instead');
    }
    const biodata = this.biodataRepository.create(createBiodataDto);
    return this.biodataRepository.save(biodata);
  }

  // Public listing: approved + active only, without the owning user's account data
  findAll() {
    return this.biodataRepository.find({
      where: {
        biodataApprovalStatus: BiodataApprovalStatus.APPROVED,
        biodataVisibilityStatus: BiodataVisibilityStatus.ACTIVE,
      },
      order: { id: 'DESC' },
    });
  }

  // Public single view: null unless approved + active
  async findOne(id: number) {
    const biodata = await this.biodataRepository.findOne({ where: { id } });
    return biodata?.isVisibleToPublic() ? biodata : null;
  }

  findByUserId(userId: number) {
    return this.biodataRepository.findOne({
      where: { userId },
      relations: { user: true }
    });
  }

  // Internal lookup without status filtering (for admin/owner access)
  private findOneInternal(id: number) {
    return this.biodataRepository.findOne({
      where: { id },
      relations: { user: true }
    });
  }

  // Admin: all biodatas regardless of status
  findAllForAdmin() {
    return this.biodataRepository.find({
      relations: { user: true },
      order: { id: 'DESC' }
    });
  }

  // Owner: their own biodata regardless of status
  findOneForOwner(id: number) {
    return this.findOneInternal(id);
  }

  async updateApprovalStatus(id: number, approvalStatus: BiodataApprovalStatus) {
    const result = await this.biodataRepository.update(id, { biodataApprovalStatus: approvalStatus });
    if (!result.affected) {
      throw new NotFoundException('Biodata not found');
    }
    return this.findOneInternal(id);
  }

  // User method to toggle their biodata visibility
  async toggleUserVisibility(userId: number): Promise<{ success: boolean; message: string; newStatus?: string }> {
    const biodata = await this.findByUserId(userId);

    if (!biodata) {
      return { success: false, message: 'Biodata not found' };
    }

    if (!biodata.canUserToggle()) {
      return {
        success: false,
        message: 'You cannot toggle your biodata visibility. Your biodata must be approved by admin first.'
      };
    }

    const newVisibilityStatus = biodata.biodataVisibilityStatus === BiodataVisibilityStatus.ACTIVE
      ? BiodataVisibilityStatus.INACTIVE
      : BiodataVisibilityStatus.ACTIVE;

    await this.biodataRepository.update(biodata.id, { biodataVisibilityStatus: newVisibilityStatus });
    biodata.biodataVisibilityStatus = newVisibilityStatus;

    return {
      success: true,
      message: newVisibilityStatus === BiodataVisibilityStatus.ACTIVE
        ? 'Biodata is now visible to others'
        : 'Biodata is now hidden from others',
      newStatus: biodata.getEffectiveStatus()
    };
  }

  async update(id: number, updateBiodataDto: UpdateBiodataDto) {
    const result = await this.biodataRepository.update(id, toUpdateData(updateBiodataDto));
    if (!result.affected) {
      throw new NotFoundException('Biodata not found');
    }
    return this.findOneInternal(id);
  }

  // Create-or-update the current user's biodata
  async updateByUserId(userId: number, updateBiodataDto: UpdateBiodataDto) {
    const existingBiodata = await this.findByUserId(userId);

    if (existingBiodata) {
      await this.biodataRepository.update(existingBiodata.id, toUpdateData(updateBiodataDto));
      return this.findOneInternal(existingBiodata.id);
    }

    const biodata = this.biodataRepository.create({ ...toUpdateData(updateBiodataDto), userId });
    return this.biodataRepository.save(biodata);
  }

  // Validate that user owns the biodata before allowing operations
  async validateOwnership(biodataId: number, userId: number): Promise<boolean> {
    const biodata = await this.biodataRepository.findOne({ where: { id: biodataId }, select: { id: true, userId: true } });
    return !!biodata && biodata.userId === userId;
  }

  async remove(id: number) {
    const result = await this.biodataRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Biodata not found');
    }
    return result;
  }

  async searchBiodatas(filters: {
    gender?: string;
    maritalStatus?: string;
    location?: string;
    biodataNumber?: number;
    ageMin?: number;
    ageMax?: number;
    page: number;
    limit: number;
  }) {
    const { gender, maritalStatus, location, biodataNumber, ageMin, ageMax, page, limit } = filters;

    // Only approved + active biodatas are searchable; filter and paginate in SQL
    const queryBuilder = this.biodataRepository
      .createQueryBuilder('biodata')
      .where('biodata.biodataApprovalStatus = :approved', { approved: BiodataApprovalStatus.APPROVED })
      .andWhere('biodata.biodataVisibilityStatus = :active', { active: BiodataVisibilityStatus.ACTIVE });

    if (biodataNumber !== undefined) {
      queryBuilder.andWhere('biodata.id = :id', { id: biodataNumber });
    }

    if (gender && gender !== 'all') {
      queryBuilder.andWhere('biodata.biodataType = :gender', { gender });
    }

    if (maritalStatus && maritalStatus !== 'all') {
      queryBuilder.andWhere('biodata.maritalStatus = :maritalStatus', { maritalStatus });
    }

    // Location matches present or permanent address
    if (location) {
      queryBuilder.andWhere(
        '(biodata.presentCountry ILIKE :location OR biodata.presentDivision ILIKE :location OR biodata.presentZilla ILIKE :location OR biodata.permanentCountry ILIKE :location OR biodata.permanentDivision ILIKE :location OR biodata.permanentZilla ILIKE :location)',
        { location: `%${location}%` }
      );
    }

    if (ageMin !== undefined) {
      queryBuilder.andWhere('biodata.age >= :ageMin', { ageMin });
    }
    if (ageMax !== undefined) {
      queryBuilder.andWhere('biodata.age <= :ageMax', { ageMax });
    }

    const [biodatas, total] = await queryBuilder
      .orderBy('biodata.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: biodatas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // For multi-step form: update step and partial data
  async updateStep(id: number, step: number, partialData: UpdateBiodataDto) {
    await this.biodataRepository.update(id, { ...toUpdateData(partialData), step });
    // Owner endpoint: return the biodata regardless of approval state
    return this.findOneInternal(id);
  }

  // Profile view tracking methods
  async trackProfileView(biodataId: number, viewerId?: number, ipAddress?: string, userAgent?: string) {
    const biodata = await this.biodataRepository.findOne({ where: { id: biodataId }, select: { id: true, userId: true } });
    if (!biodata) {
      throw new NotFoundException('Biodata not found');
    }

    // Don't count views from the profile owner
    if (viewerId && biodata.userId === viewerId) {
      return { counted: false, reason: 'Owner view not counted' };
    }

    // One counted view per viewer (or anonymous IP) per 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    let existingView: ProfileView | null = null;
    if (viewerId) {
      existingView = await this.profileViewRepository
        .createQueryBuilder('view')
        .where('view.biodataId = :biodataId', { biodataId })
        .andWhere('view.viewerId = :viewerId', { viewerId })
        .andWhere('view.viewedAt >= :twentyFourHoursAgo', { twentyFourHoursAgo })
        .getOne();
    } else if (ipAddress) {
      existingView = await this.profileViewRepository
        .createQueryBuilder('view')
        .where('view.biodataId = :biodataId', { biodataId })
        .andWhere('view.viewerId IS NULL')
        .andWhere('view.ipAddress = :ipAddress', { ipAddress })
        .andWhere('view.viewedAt >= :twentyFourHoursAgo', { twentyFourHoursAgo })
        .getOne();
    }

    if (existingView) {
      return { counted: false, reason: 'Already viewed within 24 hours' };
    }

    await this.profileViewRepository.save(this.profileViewRepository.create({
      biodataId,
      viewerId,
      ipAddress,
      userAgent
    }));
    await this.biodataRepository.increment({ id: biodataId }, 'viewCount', 1);

    return { counted: true, reason: 'View counted successfully' };
  }

  async getProfileViewCount(biodataId: number): Promise<number> {
    const biodata = await this.biodataRepository.findOne({ where: { id: biodataId }, select: { id: true, viewCount: true } });
    return biodata?.viewCount || 0;
  }

  async getUserProfileViewCount(userId: number): Promise<number> {
    const biodata = await this.findByUserId(userId);
    return biodata?.viewCount || 0;
  }

  // Detailed view statistics for a user's own biodata
  async getUserProfileViewStats(userId: number) {
    const biodata = await this.findByUserId(userId);
    if (!biodata) {
      return { totalViews: 0, recentViews: 0, viewsThisMonth: 0 };
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentViews = await this.profileViewRepository
      .createQueryBuilder('view')
      .where('view.biodataId = :biodataId', { biodataId: biodata.id })
      .andWhere('view.viewedAt >= :sevenDaysAgo', { sevenDaysAgo })
      .getCount();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const viewsThisMonth = await this.profileViewRepository
      .createQueryBuilder('view')
      .where('view.biodataId = :biodataId', { biodataId: biodata.id })
      .andWhere('view.viewedAt >= :startOfMonth', { startOfMonth })
      .getCount();

    return {
      totalViews: biodata.viewCount || 0,
      recentViews,
      viewsThisMonth
    };
  }
}
