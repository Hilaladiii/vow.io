-- CreateEnum
CREATE TYPE "EnvelopeStatus" AS ENUM ('DRAFT', 'SENT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SignerStatus" AS ENUM ('PENDING', 'SIGNED');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('SIGNATURE', 'DATE', 'TEXT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "envelope_id" TEXT NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "envelopes" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EnvelopeStatus" NOT NULL,

    CONSTRAINT "envelopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "SignerStatus" NOT NULL DEFAULT 'PENDING',
    "envelope_id" TEXT NOT NULL,

    CONSTRAINT "signers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fields" (
    "id" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "page_number" INTEGER NOT NULL,
    "signer_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "datetime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "envelope_id" TEXT NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "signers_email_key" ON "signers"("email");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_envelope_id_fkey" FOREIGN KEY ("envelope_id") REFERENCES "envelopes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signers" ADD CONSTRAINT "signers_envelope_id_fkey" FOREIGN KEY ("envelope_id") REFERENCES "envelopes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_signer_id_fkey" FOREIGN KEY ("signer_id") REFERENCES "signers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_envelope_id_fkey" FOREIGN KEY ("envelope_id") REFERENCES "envelopes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
