import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './favorites.entity';
import { User } from '../user/user.entity';
import { Biodata } from '../biodata/biodata.entity';
import { BiodataApprovalStatus } from '../biodata/enums/admin-approval-status.enum';
import { BiodataVisibilityStatus } from '../biodata/enums/user-visibility-status.enum';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
    @InjectRepository(Biodata)
    private biodataRepository: Repository<Biodata>,
  ) {}

  async addToFavorites(userId: number, biodataId: number): Promise<Favorite> {
    // Check if biodata exists
    // Only publicly visible biodatas can be favorited
    const biodata = await this.biodataRepository.findOne({ where: { id: biodataId } });
    if (!biodata?.isVisibleToPublic()) {
      throw new NotFoundException('Biodata not found');
    }

    // Check if already in favorites
    const existingFavorite = await this.favoritesRepository.findOne({
      where: { user: { id: userId }, biodata: { id: biodataId } }
    });

    if (existingFavorite) {
      throw new ConflictException('Biodata already in favorites');
    }

    // Create new favorite
    const favorite = this.favoritesRepository.create({
      user: { id: userId } as User,
      biodata: { id: biodataId } as Biodata,
    });

    return await this.favoritesRepository.save(favorite);
  }

  async removeFromFavorites(userId: number, biodataId: number): Promise<void> {
    const favorite = await this.favoritesRepository.findOne({
      where: { user: { id: userId }, biodata: { id: biodataId } }
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoritesRepository.remove(favorite);
  }

  async getUserFavorites(userId: number): Promise<Favorite[]> {
    const favorites = await this.favoritesRepository.find({
      where: { user: { id: userId } },
      relations: { biodata: true },
      order: { createdAt: 'DESC' }
    });
    // Hide biodatas that were unapproved or made private after being favorited
    return favorites.filter((favorite) => favorite.biodata?.isVisibleToPublic());
  }

  async isFavorite(userId: number, biodataId: number): Promise<boolean> {
    const favorite = await this.favoritesRepository.findOne({
      where: { user: { id: userId }, biodata: { id: biodataId } }
    });
    return !!favorite;
  }

  async getFavoriteCount(userId: number): Promise<number> {
    // Same visibility rule as getUserFavorites
    return await this.favoritesRepository.count({
      where: {
        user: { id: userId },
        biodata: {
          biodataApprovalStatus: BiodataApprovalStatus.APPROVED,
          biodataVisibilityStatus: BiodataVisibilityStatus.ACTIVE,
        },
      },
    });
  }
}