import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
  Query,
  Req,
  ForbiddenException,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import { BiodataService } from './biodata.service';
import { CreateBiodataDto } from './dto/create-biodata.dto';
import { UpdateBiodataDto } from './dto/update-biodata.dto';
import { UpdateApprovalStatusDto } from './dto/update-approval-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthPayload } from '../auth/interfaces/auth-payload.interface';
import type { Request } from 'express';
import { BiodataApprovalStatus } from './enums/admin-approval-status.enum';

const isAdmin = (user: AuthPayload) => user.role === 'admin' || user.role === 'superadmin';

// Owners may save a draft or submit for review; every other approval state is set by admins
const OWNER_APPROVAL_STATUSES: ReadonlyArray<BiodataApprovalStatus> = [
  BiodataApprovalStatus.IN_PROGRESS,
  BiodataApprovalStatus.PENDING,
];

function assertOwnerSettableStatus(dto: UpdateBiodataDto) {
  if (dto.biodataApprovalStatus !== undefined && !OWNER_APPROVAL_STATUSES.includes(dto.biodataApprovalStatus)) {
    throw new ForbiddenException('Only an admin can set the approval status to ' + dto.biodataApprovalStatus);
  }
}

const toInt = (value: string | undefined) => {
  const n = value === undefined ? NaN : parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
};

@Controller('biodatas')
export class BiodataController {
  constructor(private readonly biodataService: BiodataService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createBiodataDto: CreateBiodataDto, @CurrentUser() user: AuthPayload) {
    assertOwnerSettableStatus(createBiodataDto);
    return this.biodataService.create({ ...createBiodataDto, userId: user.id });
  }

  @Get()
  findAll() {
    return this.biodataService.findAll();
  }

  @Get('search')
  searchBiodatas(
    @Query('gender') gender?: string,
    @Query('maritalStatus') maritalStatus?: string,
    @Query('location') location?: string,
    @Query('biodataNumber') biodataNumber?: string,
    @Query('ageMin') ageMin?: string,
    @Query('ageMax') ageMax?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.biodataService.searchBiodatas({
      gender,
      maritalStatus,
      location,
      biodataNumber: toInt(biodataNumber),
      ageMin: toInt(ageMin),
      ageMax: toInt(ageMax),
      page: Math.max(1, toInt(page) ?? 1),
      limit: Math.min(50, Math.max(1, toInt(limit) ?? 6)),
    });
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  findCurrent(@CurrentUser() user: AuthPayload) {
    // null (as JSON) when the user has no biodata yet
    return this.biodataService.findByUserId(user.id);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  findAllForAdmin(@CurrentUser() user: AuthPayload) {
    if (!isAdmin(user)) {
      throw new ForbiddenException('Access denied: Only admin and superadmin can view all biodatas');
    }
    return this.biodataService.findAllForAdmin();
  }

  @Get('owner/:id')
  @UseGuards(JwtAuthGuard)
  async findOneForOwner(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthPayload) {
    if (!(await this.biodataService.validateOwnership(id, user.id))) {
      throw new ForbiddenException('Access denied: You can only access your own biodata');
    }
    return this.biodataService.findOneForOwner(id);
  }

  @Put(':id/approval-status')
  @UseGuards(JwtAuthGuard)
  updateApprovalStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() { status }: UpdateApprovalStatusDto,
    @CurrentUser() user: AuthPayload,
  ) {
    if (!isAdmin(user)) {
      throw new ForbiddenException('Access denied: Only admin and superadmin can update biodata approval status');
    }
    return this.biodataService.updateApprovalStatus(id, status);
  }

  @Put('current/toggle-visibility')
  @UseGuards(JwtAuthGuard)
  toggleUserVisibility(@CurrentUser() user: AuthPayload) {
    return this.biodataService.toggleUserVisibility(user.id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const biodata = await this.biodataService.findOne(id);
    if (!biodata) {
      throw new NotFoundException('Biodata not found');
    }
    return biodata;
  }

  @Put('current')
  @UseGuards(JwtAuthGuard)
  updateCurrent(@Body() updateBiodataDto: UpdateBiodataDto, @CurrentUser() user: AuthPayload) {
    assertOwnerSettableStatus(updateBiodataDto);
    return this.biodataService.updateByUserId(user.id, updateBiodataDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateBiodataDto: UpdateBiodataDto, @CurrentUser() user: AuthPayload) {
    return this.updateAsOwnerOrAdmin(id, updateBiodataDto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  patch(@Param('id', ParseIntPipe) id: number, @Body() updateBiodataDto: UpdateBiodataDto, @CurrentUser() user: AuthPayload) {
    return this.updateAsOwnerOrAdmin(id, updateBiodataDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthPayload) {
    // Superadmin can delete any biodata; everyone else only their own
    if (user.role !== 'superadmin' && !(await this.biodataService.validateOwnership(id, user.id))) {
      throw new ForbiddenException('You can only delete your own biodata');
    }
    return this.biodataService.remove(id);
  }

  // For multi-step form: update step and partial data
  @Put(':id/step/:step')
  @UseGuards(JwtAuthGuard)
  async updateStep(
    @Param('id', ParseIntPipe) id: number,
    @Param('step', ParseIntPipe) step: number,
    @Body() partialData: UpdateBiodataDto,
    @CurrentUser() user: AuthPayload
  ) {
    if (!(await this.biodataService.validateOwnership(id, user.id))) {
      throw new ForbiddenException('You can only update your own biodata');
    }
    assertOwnerSettableStatus(partialData);
    return this.biodataService.updateStep(id, step, partialData);
  }

  // Profile view tracking endpoints
  @Post(':id/view')
  trackProfileView(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const ipAddress = req.ip || req.socket?.remoteAddress || undefined;
    const userAgent = req.get('User-Agent') || undefined;
    // Anonymous tracking (deduplicated per IP for 24h)
    return this.biodataService.trackProfileView(id, undefined, ipAddress, userAgent);
  }

  @Get(':id/view-count')
  async getProfileViewCount(@Param('id', ParseIntPipe) id: number) {
    return { viewCount: await this.biodataService.getProfileViewCount(id) };
  }

  @Get('current/view-stats')
  @UseGuards(JwtAuthGuard)
  getUserProfileViewStats(@CurrentUser() user: AuthPayload) {
    return this.biodataService.getUserProfileViewStats(user.id);
  }

  private async updateAsOwnerOrAdmin(id: number, dto: UpdateBiodataDto, user: AuthPayload) {
    if (!isAdmin(user)) {
      if (!(await this.biodataService.validateOwnership(id, user.id))) {
        throw new ForbiddenException('You can only update your own biodata');
      }
      assertOwnerSettableStatus(dto);
    }
    return this.biodataService.update(id, dto);
  }
}
