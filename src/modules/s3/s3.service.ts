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
import * as mime from 'mime-types';
import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class S3Service implements OnModuleInit {
  private s3Client: S3Client;
  private bucketName: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(
    private configService: ConfigService,
    private encryptionService: EncryptionService,
  ) {
    this.s3Client = new S3Client({
      endpoint: this.configService.get('S3_ENDPOINT'),
      region: this.configService.get('S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get('S3_SECRET_KEY'),
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
      const key = `${file.originalname}-${new Date()}`;
      const encrypted = this.encryptionService.encrypt(file.buffer);
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: encrypted,
        ContentType: 'application/octet-stream',
        Metadata: {
          'original-mime-type': file.mimetype,
        },
      });

      await this.s3Client.send(command);
      const url = await this.get(key);
      return {
        url,
        filename: key,
      };
    } catch (error) {
      throw error;
    }
  }

  async uploadBuffer(buffer: Buffer, key: string) {
    const encrypted = this.encryptionService.encrypt(buffer);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: encrypted,
      ContentType: 'application/octet-stream',
      Metadata: {
        'original-mime-type': mime.lookup(key) || 'application/octet-stream',
      },
    });

    await this.s3Client.send(command);
    const url = await this.get(key);
    return {
      url,
    };
  }

  async getFileBuffer(key: string) {
    const command = new GetObjectCommand({ Bucket: this.bucketName, Key: key });
    const response = await this.s3Client.send(command);
    const byteArray = await response.Body.transformToByteArray();
    const encryptedBuffer = Buffer.from(byteArray);
    return this.encryptionService.decrypt(encryptedBuffer);
  }

  async get(filename: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: filename,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 * 24 });
  }
}
