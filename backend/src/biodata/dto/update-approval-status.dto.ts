import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BiodataApprovalStatus } from '../enums/admin-approval-status.enum';

export class UpdateApprovalStatusDto {
  @ApiProperty({ enum: BiodataApprovalStatus })
  @IsEnum(BiodataApprovalStatus)
  status: BiodataApprovalStatus;
}
