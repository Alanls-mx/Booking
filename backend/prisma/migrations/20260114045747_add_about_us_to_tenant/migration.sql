-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "aboutUs" TEXT;
