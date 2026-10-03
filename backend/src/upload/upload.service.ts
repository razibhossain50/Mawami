import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class UploadService {
    private s3: S3Client;
    private readonly bucket: string;
    private readonly cdnBaseUrl?: string; // e.g., https://pub-xxxx.r2.dev (already bound to bucket)
    private readonly publicBaseUrl?: string; // e.g., https://<account>.r2.cloudflarestorage.com
    private readonly folder = 'profile-pictures';

    constructor(private readonly config: ConfigService) {
        const accountId = this.config.get<string>('CLOUDFLARE_ACCOUNT_ID');
        const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
        const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucket = this.config.get<string>('R2_BUCKET_NAME') as string;
    this.cdnBaseUrl = this.config.get<string>('NEXT_PUBLIC_R2_BASE_URL') || undefined;
    this.publicBaseUrl = this.config.get<string>('R2_PUBLIC_URL') || undefined;

        if (!accountId || !accessKeyId || !secretAccessKey || !this.bucket) {
            throw new Error('Missing Cloudflare R2 configuration. Check CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME');
        }

        this.s3 = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId, secretAccessKey },
            forcePathStyle: true,
        });
    }

    private buildKey(mimetype: string): string {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        // Derive the extension from the validated MIME type, never the client filename
        const ext = mimetype === 'image/png' ? '.png' : '.jpg';
        return `${this.folder}/profile-${uniqueSuffix}${ext}`;
    }

    private buildPublicUrl(key: string): string {
        // Prefer CDN/public base (like r2.dev) where the bucket is already mapped
        if (this.cdnBaseUrl) {
            const base = this.cdnBaseUrl.replace(/\/$/, '');
            return `${base}/${key}`;
        }

        // Fallback to configured public base URL (may or may not include bucket)
        if (this.publicBaseUrl) {
            const normalized = this.publicBaseUrl.replace(/\/$/, '');
            if (normalized.endsWith(`/${this.bucket}`)) {
                return `${normalized}/${key}`;
            }
            return `${normalized}/${this.bucket}/${key}`;
        }

        // Final fallback to account endpoint
        const accountId = this.config.get<string>('CLOUDFLARE_ACCOUNT_ID');
        return `https://${accountId}.r2.cloudflarestorage.com/${this.bucket}/${key}`;
    }

    async uploadProfilePicture(file: Express.Multer.File): Promise<{ key: string; url: string; size: number }>
    {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        if (!file.mimetype.match(/^image\/(jpeg|jpg|png)$/)) {
            throw new BadRequestException('Only JPEG and PNG images are allowed');
        }

        const key = this.buildKey(file.mimetype);
    await this.s3.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
    }));

        const url = this.buildPublicUrl(key);
        return { key, url, size: file.size };
    }

    async deleteFile(key: string): Promise<boolean> {
        try {
            await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
            return true;
        } catch (error) {
            console.error('Error deleting file from R2:', error);
            return false;
        }
    }
}