import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private configService: ConfigService) {
    const keyString = this.configService.getOrThrow<string>('ENCRYPTION_KEY');
    this.key = Buffer.from(keyString, 'hex');
  }

  encrypt(buffer: Buffer): Buffer {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]);
  }

  decrypt(encryptedBuffer: Buffer): Buffer {
    const iv = encryptedBuffer.subarray(0, 16);
    const authTag = encryptedBuffer.subarray(16, 32);
    const encryptedContent = encryptedBuffer.subarray(32);

    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encryptedContent), decipher.final()]);
  }
}
