/*
  Warnings:

  - You are about to drop the column `number` on the `Unit` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Unit` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[propertyId,unitCode]` on the table `Unit` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `numberOfFloors` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `baseRent` to the `RentInvoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitCode` to the `Unit` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UnitCondition" AS ENUM ('GOOD', 'WORKING', 'NOT_WORKING');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('THREE_BEDROOM', 'TWO_BEDROOM', 'ONE_BEDROOM', 'BEDSITTER', 'SINGLE_ROOM', 'SHOP', 'OFFICE');

-- DropIndex
DROP INDEX "Property_createdById_idx";

-- DropIndex
DROP INDEX "Unit_propertyId_number_key";

-- DropIndex
DROP INDEX "User_createdByAdminId_idx";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "numberOfFloors" INTEGER NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "unitsPerFloor" INTEGER;

-- AlterTable
ALTER TABLE "RentInvoice" ADD COLUMN     "baseRent" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "waterBill" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Unit" DROP COLUMN "number",
DROP COLUMN "type",
ADD COLUMN     "cabinetsCondition" "UnitCondition",
ADD COLUMN     "doorsCondition" "UnitCondition",
ADD COLUMN     "electricalAppliancesCondition" "UnitCondition",
ADD COLUMN     "floor" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sinkCondition" "UnitCondition",
ADD COLUMN     "toiletCondition" "UnitCondition",
ADD COLUMN     "unitCode" TEXT NOT NULL,
ADD COLUMN     "unitType" "UnitType",
ALTER COLUMN "rent" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PaymentArchive" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reference" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT,
    "invoiceId" TEXT,

    CONSTRAINT "PaymentArchive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterReading" (
    "id" TEXT NOT NULL,
    "reading" DOUBLE PRECISION NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "unitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaterReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Arrears" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Arrears_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WaterReading_unitId_year_month_key" ON "WaterReading"("unitId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Arrears_tenantId_key" ON "Arrears"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_propertyId_unitCode_key" ON "Unit"("propertyId", "unitCode");

-- AddForeignKey
ALTER TABLE "PaymentArchive" ADD CONSTRAINT "PaymentArchive_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentArchive" ADD CONSTRAINT "PaymentArchive_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "RentInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterReading" ADD CONSTRAINT "WaterReading_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arrears" ADD CONSTRAINT "Arrears_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
