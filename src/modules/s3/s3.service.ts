import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service implements OnModuleInit {
  private s3Client: S3Client;
  private bucketName: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      endpoint: this.configService.get('S3_ENDPOINT'),
      region: this.configService.get('S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get('S3_ACCESS_KEY'),
      },
      forcePathStyle: true,
    });
    this.bucketName = this.configService.get('S3_BUCKET_NAME');
  }

  async onModuleInit() {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
    } catch (error) {
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        this.logger.log(
          `Bucket ${this.bucketName} tidak ditemukan. Membuat bucket...`,
        );
        try {
          await this.s3Client.send(
            new CreateBucketCommand({ Bucket: this.bucketName }),
          );
          this.logger.log(`Bucket ${this.bucketName} berhasil dibuat.`);
        } catch (createError) {
          this.logger.error(`Gagal membuat bucket: ${createError.message}`);
        }
      }
    }
  }

  async upload(file: Express.Multer.File) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);
      return {
        url: `${this.configService.get('S3_ENDPOINT')}/${this.bucketName}/${file.originalname}`,
        filename: file.originalname,
      };
    } catch (error) {
      throw error;
    }
  }

  async get(filename: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: filename,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
}
