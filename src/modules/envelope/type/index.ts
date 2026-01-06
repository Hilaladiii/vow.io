import { Field, Prisma, Signer } from 'generated/prisma/client';
import { PaginationResult } from 'src/commons/types/pagination.type';

export type EnvelopesGetRequest = {
  userId: string;
  pagination: PaginationResult;
  subject?: string;
  sortBy?: keyof Prisma.EnvelopeWhereInput;
  sortOrder?: 'asc' | 'desc';
};

export type EnvelopesGetBySignerRequest = {
  signerId: string;
  ipAddress: string;
  envelopeId: string;
};

export type EnvelopeAddSignerRequest = {
  envelopeId: string;
  signers: Pick<Signer, 'firstName' | 'lastName' | 'email'>[];
};

export type EnvelopeSentRequest = {
  userId: string;
  ipAddress: string;
  envelopeId: string;
  subject: string;
  description?: string;
  fields: Pick<Field, 'signerId' | 'pageNumber' | 'type' | 'x' | 'y'>[];
};

export type EnvelopeSignRequest = {
  signerId: string;
  envelopeId: string;
  fieldId: string;
  ipAddress: string;
  value: string | Express.Multer.File;
};
